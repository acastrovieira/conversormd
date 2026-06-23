# Arquitetura e Orquestração — AIOX Vibe Coding Framework

Este documento descreve a topologia, os fluxos de dados e os princípios de controle que regem o **AIOX Vibe Coding Framework** personalizado, integrado com o **AI Governance Pack** e o catálogo de recursos **X-Squads**.

---

## 1. Topologia do Framework

O framework opera sob uma topologia modular dividida em camadas, projetada para se integrar a IDEs e ferramentas de vibe coding (como Antigravity, Claude Code, Cursor e Codex):

```
       ┌────────────────────────────────────────────────────────┐
       │                 IDE (Vibe Coding)                      │
       └──────────────────────────┬─────────────────────────────┘
                                  │ ativa
                                  ▼
       ┌────────────────────────────────────────────────────────┐
       │            SKILL: aiox-vibe-framework                  │
       │  (Enforça Constituição, Guardrails e Custos de IA)      │
       └─────┬────────────────────────────────────────────┬─────┘
             │                                            │
             ▼ lê                                         ▼ roteia
┌──────────────────────────┐                ┌──────────────────────────┐
│         AGENTS           │                │         X-SQUAD          │
│  @architect | @dev | @qa │                │   (13 squads / 177 agents│
│    (Definições Locais)   │                │   condensados em prompts)│
└──────────────────────────┘                └──────────────────────────┘
```

---

## 2. Princípios de Governança Integrados

O framework incorpora diretamente os guardrails do **AI Governance Pack** e do núcleo do **AIOX**:

1. **Constituição AIOX**:
   - **CLI First**: UI é apenas para visualização; mutações ocorrem estritamente via terminal/CLI.
   - **Agent Authority**: O isolamento de ações garante que apenas o `@devops` realize pushes no Git, o `@architect` decida sobre a estrutura e o `@qa` certifique as entregas.
   - **Story-Driven**: Nenhuma linha de código deve ser escrita sem uma história documentada sob `docs/stories/`.

2. **Cost Rules (Orçamento)**:
   - Limitação das respostas a formatos objetivos.
   - Compactação e sumarização ativa de contextos longos de chat para reduzir custos de API.
   - Alertas progressivos em **50%**, **75%**, **90%** e **100%** do consumo planejado.

3. **Global Guardrails**:
   - **Prevenção de Alucinações**: Dizer "não consigo confirmar isso" sempre que faltar evidência.
   - **Confirmação Crítica**: Obrigatoriedade de aprovação manual do usuário antes de exclusão de arquivos, mutações em bancos de dados de produção e disparos de e-mail ou WhatsApp.

---

## 3. Os 8 Quality Gates de Homologação

Para certificar que suas futuras habilidades personalizadas atendam ao padrão de qualidade, o validador `quick_validate.py` aplica os seguintes testes:

- **Gate 1**: Validade do frontmatter YAML (terceira pessoa, keywords explícitas e negative boundaries).
- **Gate 2**: Progressive Disclosure (limite recomendado de $\le 500$ linhas no `SKILL.md`).
- **Gate 3**: Tom imperativo (impedindo termos prolixos ou passivos como "você deve" ou "por favor").
- **Gate 4**: Robustez de Scripts (toda operação complexa de I/O em scripts locais robustos).
- **Gate 5**: Segurança (verificação ativa contra vazamento de caminhos absolutos locais ou credenciais).
- **Gate 6**: Evals estruturados (presença de pelo menos 2 casos de teste e asserções objetivas).
- **Gate 7**: Cobertura de Gatilhos (registro de pelo menos 10 queries positivas e 10 negativas em `trigger_test_queries.md`).
- **Gate 8**: Skill-Squad Runtime Binding (vinculação obrigatória dos metadados da skill com os metadados do squad em `squad-runtime.md` e `squad.yaml`).
