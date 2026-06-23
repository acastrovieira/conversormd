#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml"]
# ///
"""
quick_validate.py — Validador Rápido de Skills AIOX (Tier S+++ Standard)

Valida uma skill contra os 8 Quality Gates de forma determinística.
Retorna exit 0 se aprovada, exit 1 se reprovada.

Uso:
    uv run scripts/quick_validate.py <skill_directory>
    uv run scripts/quick_validate.py <skill_directory> --verbose
    uv run scripts/quick_validate.py <skill_directory> --gates 1,2,3
"""

import sys
import os
import re
import argparse
import json
import importlib.util
from pathlib import Path

try:
    import yaml
except ImportError:
    print("❌ PyYAML não instalado. Execute: uv run scripts/quick_validate.py", file=sys.stderr)
    sys.exit(1)

# ==============================================================================
# Constantes
# ==============================================================================
ALLOWED_FRONTMATTER_KEYS = {'name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility', 'triggers', 'files_to_load', 'output_format', 'context_signals'}
MAX_NAME_LENGTH = 64
MAX_DESCRIPTION_LENGTH = 1024
MAX_SKILL_LINES = 500
SQUAD_RUNTIME_BOOTSTRAP_START = '<!-- SQUAD-RUNTIME-BOOTSTRAP:START -->'
SQUAD_RUNTIME_BOOTSTRAP_END = '<!-- SQUAD-RUNTIME-BOOTSTRAP:END -->'

# Padrões que violam Gate 3 (redação imperativa)
NON_IMPERATIVE_PATTERNS = [
    r'\bvocê deve\b',
    r'\bvocê deveria\b',
    r'\bpor favor\b',
    r'\bpoderia\b',
    r'\bé recomendado\b',
    r'\byou should\b',
    r'\byou must\b',
    r'\bplease\b',
]


# ==============================================================================
# Gates de Validação
# ==============================================================================
def gate1_frontmatter(skill_path: Path, verbose: bool) -> list[dict]:
    """Gate 1: Frontmatter & Descoberta"""
    failures = []
    skill_md = skill_path / 'SKILL.md'

    if not skill_md.exists():
        return [{"gate": 1, "severity": "CRITICAL", "message": "SKILL.md não encontrado na raiz da skill"}]

    content = skill_md.read_text(encoding='utf-8')

    if not content.startswith('---'):
        return [{"gate": 1, "severity": "CRITICAL", "message": "Frontmatter YAML ausente (deve começar com ---)"}]

    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return [{"gate": 1, "severity": "CRITICAL", "message": "Formato de frontmatter inválido"}]

    try:
        frontmatter = yaml.safe_load(match.group(1))
    except yaml.YAMLError as e:
        return [{"gate": 1, "severity": "CRITICAL", "message": f"YAML inválido no frontmatter: {e}"}]

    if not isinstance(frontmatter, dict):
        return [{"gate": 1, "severity": "CRITICAL", "message": "Frontmatter deve ser um dicionário YAML"}]

    # Chaves inesperadas
    unexpected = set(frontmatter.keys()) - ALLOWED_FRONTMATTER_KEYS
    if unexpected:
        failures.append({"gate": 1, "severity": "ERROR",
                         "message": f"Chaves não permitidas no frontmatter: {', '.join(sorted(unexpected))}. "
                                    f"Permitidas: {', '.join(sorted(ALLOWED_FRONTMATTER_KEYS))}"})

    # name
    name = frontmatter.get('name', '')
    if not name:
        failures.append({"gate": 1, "severity": "CRITICAL", "message": "Campo 'name' ausente no frontmatter"})
    else:
        name = str(name).strip()
        if not re.match(r'^[a-z0-9-]+$', name):
            failures.append({"gate": 1, "severity": "WARNING",
                             "message": f"name '{name}' idealmente kebab-case (apenas minúsculas, dígitos e hifens). Aceito para skills legadas."})
        if name.startswith('-') or name.endswith('-') or '--' in name:
            failures.append({"gate": 1, "severity": "ERROR",
                             "message": f"name '{name}' não pode começar/terminar com hífen ou ter hifens consecutivos"})
        if len(name) > MAX_NAME_LENGTH:
            failures.append({"gate": 1, "severity": "ERROR",
                             "message": f"name muito longo ({len(name)} chars). Máximo: {MAX_NAME_LENGTH}"})

    # description
    description = frontmatter.get('description', '')
    if not description:
        failures.append({"gate": 1, "severity": "CRITICAL", "message": "Campo 'description' ausente no frontmatter"})
    else:
        description = str(description).strip()
        if '<' in description or '>' in description:
            failures.append({"gate": 1, "severity": "ERROR",
                             "message": "description não pode conter os símbolos < ou >"})
        if len(description) > MAX_DESCRIPTION_LENGTH:
            failures.append({"gate": 1, "severity": "WARNING",
                             "message": f"description longa ({len(description)} chars). Recomendado: < {MAX_DESCRIPTION_LENGTH}. OK para skills complexas."})
        # Check pushy keywords (WHEN coverage)
        lower_desc = description.lower()
        if 'use this skill' in lower_desc or 'use quando' in lower_desc or 'use when' in lower_desc:
            failures.append({"gate": 1, "severity": "WARNING",
                             "message": "description usa primeira pessoa imperativa ('Use this skill'/'Use quando'). "
                                        "Reescrever em terceira pessoa: 'Processa...', 'Projeta...', 'Audita...'"})

    return failures


def gate2_progressive_disclosure(skill_path: Path, verbose: bool) -> list[dict]:
    """Gate 2: Progressive Disclosure — tamanho do SKILL.md"""
    failures = []
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return []

    line_count = len(skill_md.read_text(encoding='utf-8').splitlines())
    if line_count > MAX_SKILL_LINES:
        failures.append({"gate": 2, "severity": "WARNING",
                         "message": f"SKILL.md tem {line_count} linhas. Máximo recomendado: {MAX_SKILL_LINES}. "
                                    "Considere mover detalhes para references/ (opcional para skills grandes)."})
    elif verbose:
        print(f"  ✅ Gate 2: SKILL.md com {line_count} linhas (limite: {MAX_SKILL_LINES})", file=sys.stderr)

    return failures


def gate3_imperative_writing(skill_path: Path, verbose: bool) -> list[dict]:
    """Gate 3: Redação Imperativa — detecta padrões não-imperativos"""
    failures = []
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return []

    content = skill_md.read_text(encoding='utf-8').lower()
    violations = []
    for pattern in NON_IMPERATIVE_PATTERNS:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            violations.append(pattern.replace(r'\b', '').strip())

    if violations:
        failures.append({"gate": 3, "severity": "WARNING",
                         "message": f"Padrões não-imperativos detectados: {', '.join(violations)}. "
                                    "Substituir por verbos no imperativo: 'Execute', 'Crie', 'Valide'"})

    return failures


def gate4_scripts_exist(skill_path: Path, verbose: bool) -> list[dict]:
    """Gate 4: Robustez de Caminho — verifica existência de scripts/"""
    failures = []
    scripts_dir = skill_path / 'scripts'

    if not scripts_dir.exists():
        failures.append({"gate": 4, "severity": "WARNING",
                         "message": "Diretório scripts/ não encontrado. "
                                    "Skills com operações de I/O devem ter scripts Python robustos em scripts/"})
    else:
        py_files = list(scripts_dir.glob('*.py'))
        if not py_files and verbose:
            failures.append({"gate": 4, "severity": "WARNING",
                             "message": "scripts/ existe mas está vazio. Adicionar scripts CLI com argparse"})

    return failures


def gate5_security(skill_path: Path, verbose: bool) -> list[dict]:
    """Gate 5: Segurança — verifica hardcoded secrets e paths absolutos"""
    failures = []
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return []

    content = skill_md.read_text(encoding='utf-8')

    # Patterns que indicam possível leak de segredos
    secret_patterns = [
        (r'(api[_-]?key|apikey|secret|token|password|passwd)\s*[:=]\s*["\'][^"\']{8,}["\']', 'possível API key/secret hardcoded'),
        (r'/Users/[a-zA-Z]+/', 'path absoluto local vazado'),
        (r'/home/[a-zA-Z]+/', 'path absoluto local vazado'),
    ]

    for pattern, description in secret_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            failures.append({"gate": 5, "severity": "CRITICAL",
                             "message": f"Gate 5 violado: {description}"})

    return failures


def gate6_evals(skill_path: Path, verbose: bool) -> list[dict]:
    """Gate 6: Benchmark & Evals — verifica existência e estrutura de evals.json"""
    failures = []
    evals_path = skill_path / 'evals' / 'evals.json'

    if not evals_path.exists():
        failures.append({"gate": 6, "severity": "ERROR",
                         "message": "evals/evals.json não encontrado. "
                                    "Criar suite de testes com pelo menos 2 casos e asserções objetivas. "
                                    "Referência: references/schemas.md"})
        return failures

    try:
        evals_data = json.loads(evals_path.read_text(encoding='utf-8'))
    except json.JSONDecodeError as e:
        return [{"gate": 6, "severity": "CRITICAL", "message": f"evals.json com JSON inválido: {e}"}]

    # Aceitar array direto OU {evals: [...]}
    if isinstance(evals_data, list):
        evals_list = evals_data
    else:
        evals_list = evals_data.get('evals', [])
    if len(evals_list) < 2:
        failures.append({"gate": 6, "severity": "ERROR",
                         "message": f"evals.json tem apenas {len(evals_list)} caso(s) de teste. Mínimo: 2"})

    for i, ev in enumerate(evals_list):
        has_assertions = (ev.get('expectations') or ev.get('expected_behavior') or
                          ev.get('must_contain') or ev.get('assertions'))
        if not has_assertions:
            failures.append({"gate": 6, "severity": "ERROR",
                             "message": f"Eval #{ev.get('id', i+1)} sem asserções (esperado: expectations, expected_behavior ou must_contain)"})
        has_prompt = ev.get('prompt') or ev.get('input')
        if not has_prompt:
            failures.append({"gate": 6, "severity": "ERROR",
                             "message": f"Eval #{ev.get('id', i+1)} sem prompt/input"})

    return failures


def gate7_trigger_queries(skill_path: Path, verbose: bool) -> list[dict]:
    """Gate 7: Otimização de Gatilho — verifica documentação das queries de teste"""
    failures = []
    queries_path = skill_path / 'references' / 'trigger_test_queries.md'

    if not queries_path.exists():
        failures.append({"gate": 7, "severity": "WARNING",
                         "message": "references/trigger_test_queries.md não encontrado. "
                                    "Documentar 10 queries positivas + 10 negativas para Gate 7."})
    else:
        content = queries_path.read_text(encoding='utf-8')
        pos_count = len(re.findall(r'\|\s*P\d+\s*\|', content))
        neg_count = len(re.findall(r'\|\s*N\d+\s*\|', content))

        if pos_count < 10:
            failures.append({"gate": 7, "severity": "WARNING",
                             "message": f"trigger_test_queries.md tem apenas {pos_count} queries positivas. Mínimo: 10"})
        if neg_count < 10:
            failures.append({"gate": 7, "severity": "WARNING",
                             "message": f"trigger_test_queries.md tem apenas {neg_count} queries negativas. Mínimo: 10"})
        elif verbose:
            print(f"  ✅ Gate 7: {pos_count} queries positivas + {neg_count} negativas documentadas", file=sys.stderr)

    return failures


def _frontmatter_name(skill_path: Path) -> str:
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return skill_path.name
    content = skill_md.read_text(encoding='utf-8')
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return skill_path.name
    try:
        frontmatter = yaml.safe_load(match.group(1)) or {}
    except yaml.YAMLError:
        return skill_path.name
    return str(frontmatter.get('name') or skill_path.name).strip()


def _load_homonymous_squad(skill_path: Path, skill_name: str) -> tuple[Path, dict] | tuple[None, None]:
    squads_root = skill_path.parent.parent / 'squads'
    squad_yaml = squads_root / skill_name / 'squad.yaml'
    if not squad_yaml.exists():
        return None, None
    try:
        data = yaml.safe_load(squad_yaml.read_text(encoding='utf-8')) or {}
    except yaml.YAMLError as e:
        return squad_yaml, {"__yaml_error__": str(e)}
    if not isinstance(data, dict):
        return squad_yaml, {}
    squad = data.get('squad', data)
    return squad_yaml, squad if isinstance(squad, dict) else {}


def _load_runtime_binding(skill_path: Path):
    skill_root = skill_path.parent
    builder_path = skill_root / 'build_squad_runtime_bindings.py'
    if not builder_path.exists():
        return None, None

    module_name = '_aiox_squad_runtime_bindings'
    spec = importlib.util.spec_from_file_location(module_name, builder_path)
    if spec is None or spec.loader is None:
        return None, None

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)

    target = skill_path.resolve()
    for binding in module.list_bindings():
        if binding.skill_dir.resolve() == target:
            return module, binding
    return module, None


def _runtime_item_id(item) -> str:
    if isinstance(item, dict):
        return str(item.get('id') or item.get('name') or item.get('file') or '').strip()
    text = str(item or '').strip()
    return text[:-3] if text.endswith('.md') else text


def _normalize_runtime_entries(value) -> list:
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        normalized = []
        for item_key, item_value in value.items():
            if isinstance(item_value, list):
                normalized.extend(item_value)
            elif isinstance(item_value, dict):
                entry = dict(item_value)
                entry.setdefault('id', item_key)
                normalized.append(entry)
            else:
                normalized.append({'id': item_key, 'file': item_value})
        return normalized
    return []


def _runtime_items(squad: dict, section: str) -> list:
    value = squad.get(section)
    normalized = _normalize_runtime_entries(value)
    if normalized:
        return normalized

    components = squad.get('components') if isinstance(squad.get('components'), dict) else {}
    value = components.get(section)
    return _normalize_runtime_entries(value)


def _runtime_leader(squad: dict) -> str:
    meta = squad.get('meta') if isinstance(squad.get('meta'), dict) else {}
    leader = squad.get('leader') or squad.get('orchestrator') or squad.get('entry_agent') or meta.get('orchestrator')
    if leader:
        return str(leader).strip()
    agents = _runtime_items(squad, 'agents')
    return _runtime_item_id(agents[0]) if agents else ''


def gate8_squad_runtime_binding(skill_path: Path, verbose: bool) -> list[dict]:
    """Gate 8: Skill-Squad Runtime Binding — valida vínculo com squad/fonte canônica."""
    failures = []
    skill_name = _frontmatter_name(skill_path)
    runtime_module, runtime_binding = _load_runtime_binding(skill_path)

    if runtime_binding is not None:
        skill_md = skill_path / 'SKILL.md'
        runtime_path = skill_path / 'references' / 'squad-runtime.md'
        skill_content = skill_md.read_text(encoding='utf-8') if skill_md.exists() else ''
        runtime_content = runtime_path.read_text(encoding='utf-8') if runtime_path.exists() else ''
        squad = runtime_binding.squad

        if squad and '__yaml_error__' in squad:
            manifest = runtime_binding.manifest_path or runtime_binding.canonical_path
            return [{"gate": 8, "severity": "CRITICAL", "message": f"manifest inválido em {manifest}: {squad['__yaml_error__']}"}]

        if runtime_binding.is_homonymous:
            squad_id = str(squad.get('id') or skill_name).strip()
            if squad_id != skill_name:
                failures.append({"gate": 8, "severity": "ERROR",
                                 "message": f"squad.id '{squad_id}' não bate com skill '{skill_name}'"})

        if SQUAD_RUNTIME_BOOTSTRAP_START not in skill_content or SQUAD_RUNTIME_BOOTSTRAP_END not in skill_content:
            failures.append({"gate": 8, "severity": "ERROR",
                             "message": "SKILL.md sem bloco Squad Runtime Bootstrap gerado"})

        if 'references/squad-runtime.md' not in skill_content:
            failures.append({"gate": 8, "severity": "ERROR",
                             "message": "SKILL.md não aponta para references/squad-runtime.md"})

        if not runtime_path.exists():
            failures.append({"gate": 8, "severity": "ERROR",
                             "message": "references/squad-runtime.md não encontrado"})
            return failures

        if runtime_binding.canonical_source and runtime_binding.canonical_source not in runtime_content:
            failures.append({"gate": 8, "severity": "ERROR",
                             "message": "runtime manifest não referencia a fonte canônica"})

        if runtime_binding.manifest_path:
            manifest_ref = runtime_module.rel(runtime_binding.manifest_path)
            if manifest_ref not in runtime_content:
                failures.append({"gate": 8, "severity": "ERROR",
                                 "message": "runtime manifest não referencia o manifest estruturado"})

        leader = runtime_module.resolve_leader(runtime_binding)
        if leader and leader != '-' and leader not in skill_content:
            failures.append({"gate": 8, "severity": "ERROR",
                             "message": f"agente líder '{leader}' ausente no bootstrap da skill"})
        if leader and leader != '-' and leader not in runtime_content:
            failures.append({"gate": 8, "severity": "ERROR",
                             "message": f"agente líder '{leader}' ausente no runtime manifest"})

        for section in ('agents', 'tasks', 'workflows'):
            values = runtime_module.binding_items(runtime_binding, section)
            for value in values:
                identifier = runtime_module.item_id(value)
                if identifier and identifier != '-' and identifier not in runtime_content:
                    failures.append({"gate": 8, "severity": "ERROR",
                                     "message": f"runtime manifest não lista {section[:-1]} '{identifier}'"})

        if verbose and not failures:
            print(f"  ✅ Gate 8: skill-squad runtime binding OK para {skill_name}", file=sys.stderr)

        return failures

    squad_yaml, squad = _load_homonymous_squad(skill_path, skill_name)

    if squad_yaml is None:
        return failures

    if squad and '__yaml_error__' in squad:
        return [{"gate": 8, "severity": "CRITICAL", "message": f"squad.yaml inválido: {squad['__yaml_error__']}"}]

    return failures


# ==============================================================================
# Executor Principal
# ==============================================================================
ALL_GATES = {
    1: gate1_frontmatter,
    2: gate2_progressive_disclosure,
    3: gate3_imperative_writing,
    4: gate4_scripts_exist,
    5: gate5_security,
    6: gate6_evals,
    7: gate7_trigger_queries,
    8: gate8_squad_runtime_binding,
}

SEVERITY_ORDER = ['CRITICAL', 'ERROR', 'WARNING']
SEVERITY_EMOJI = {'CRITICAL': '🔴', 'ERROR': '🟠', 'WARNING': '🟡'}


def run_validation(skill_path_str: str, verbose: bool = False, gates: list[int] | None = None) -> tuple[bool, list[dict]]:
    """Executa validação completa e retorna (passed, all_failures)"""
    skill_path = Path(skill_path_str).resolve()

    if not skill_path.exists():
        return False, [{"gate": 0, "severity": "CRITICAL", "message": f"Diretório não encontrado: {skill_path}"}]

    gates_to_run = gates or list(ALL_GATES.keys())
    all_failures = []

    for gate_num in gates_to_run:
        if gate_num not in ALL_GATES:
            continue
        gate_fn = ALL_GATES[gate_num]
        failures = gate_fn(skill_path, verbose)
        all_failures.extend(failures)

    has_blockers = any(f['severity'] in ('CRITICAL', 'ERROR') for f in all_failures)
    return not has_blockers, all_failures


def main():
    parser = argparse.ArgumentParser(
        description="Quick Validator de Skills AIOX — verifica conformidade com os 8 Quality Gates",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  uv run scripts/quick_validate.py skills/app-vet-creator
  uv run scripts/quick_validate.py skills/app-vet-creator --verbose
        """
    )
    parser.add_argument("skill_path", help="Caminho para o diretório da skill")
    parser.add_argument("--verbose", "-v", action="store_true", help="Exibe detalhes de cada gate")
    parser.add_argument("--gates", type=str, default=None,
                        help="Gates específicos a rodar (ex: '1,2,6'). Default: todos os 8")
    parser.add_argument("--json-output", action="store_true", help="Emite resultado em JSON para stdout")

    args = parser.parse_args()

    gates_to_run = None
    if args.gates:
        try:
            gates_to_run = [int(g.strip()) for g in args.gates.split(',')]
        except ValueError:
            print("❌ --gates deve ser uma lista de números separados por vírgula (ex: '1,2,6')", file=sys.stderr)
            sys.exit(1)

    passed, failures = run_validation(args.skill_path, verbose=args.verbose, gates=gates_to_run)

    if args.json_output:
        result = {
            "passed": passed,
            "skill_path": str(Path(args.skill_path).resolve()),
            "total_issues": len(failures),
            "criticals": sum(1 for f in failures if f['severity'] == 'CRITICAL'),
            "errors": sum(1 for f in failures if f['severity'] == 'ERROR'),
            "warnings": sum(1 for f in failures if f['severity'] == 'WARNING'),
            "issues": failures
        }
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        skill_name = Path(args.skill_path).name
        print(f"\n{'='*60}")
        print(f"  🔍 Quick Validate — {skill_name}")
        print(f"{'='*60}")

        if not failures:
            print(f"\n✅ APROVADA — Nenhum problema encontrado. Skill conforme com os 8 Quality Gates.\n")
        else:
            by_gate = {}
            for f in failures:
                g = f['gate']
                by_gate.setdefault(g, []).append(f)

            for gate_num in sorted(by_gate.keys()):
                gate_issues = by_gate[gate_num]
                gate_label = f"Gate {gate_num}" if gate_num > 0 else "Config"
                print(f"\n  {gate_label}:")
                for issue in gate_issues:
                    emoji = SEVERITY_EMOJI.get(issue['severity'], '⚪')
                    print(f"    {emoji} [{issue['severity']}] {issue['message']}")

            blockers = sum(1 for f in failures if f['severity'] in ('CRITICAL', 'ERROR'))
            warnings = sum(1 for f in failures if f['severity'] == 'WARNING')

            print(f"\n{'='*60}")
            if passed:
                print(f"  ⚠️  APROVADA COM AVISOS — {warnings} warning(s). Sem blockers críticos.")
            else:
                print(f"  ❌ REPROVADA — {blockers} blocker(s), {warnings} warning(s). Corrija antes de entregar.")
            print(f"{'='*60}\n")

    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
