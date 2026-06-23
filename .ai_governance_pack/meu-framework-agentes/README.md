# Meu Framework de Agentes (AIOX Vibe Coding & Governance)

Este é o seu repositório unificado de engenharia de agentes e governança para orquestrar o desenvolvimento de aplicações no padrão **AIOX Tier S+++**, integrado ao **AI Governance Pack**.

---

## 📂 Estrutura de Pastas

- [`/skills/aiox-vibe-framework`](file:///c:/Users/acast/OneDrive/Documentos/PROJETOS%20E%20APPS/pedro-skill-creator/meu-framework-agentes/skills/aiox-vibe-framework): A Skill mestre que orienta IAs no padrão AIOX Constitution.
- [`/agents`](file:///c:/Users/acast/OneDrive/Documentos/PROJETOS%20E%20APPS/pedro-skill-creator/meu-framework-agentes/agents): Definição de personas específicas (`dev.md`, `qa.md`, `architect.md`).
- [`/squads`](file:///c:/Users/acast/OneDrive/Documentos/PROJETOS%20E%20APPS/pedro-skill-creator/meu-framework-agentes/squads): Configuração de squads multi-agente (`squad.yaml`).
- [`/references`](file:///c:/Users/acast/OneDrive/Documentos/PROJETOS%20E%20APPS/pedro-skill-creator/meu-framework-agentes/references):
  - **[x-squads-registry.md](file:///c:/Users/acast/OneDrive/Documentos/PROJETOS%20E%20APPS/pedro-skill-creator/meu-framework-agentes/references/x-squads-registry.md)**: Compilação e guia de roteamento para os 13 squads pré-fabricados de alto nível.
  - **[governance-and-core-registry.md](file:///c:/Users/acast/OneDrive/Documentos/PROJETOS%20E%20APPS/pedro-skill-creator/meu-framework-agentes/references/governance-and-core-registry.md)**: Unificação dos guardrails globais e controle de custos das ferramentas de IA.

---

## 🛠️ Ferramentas Clínicas e scripts

### 1. Auditor Rápido de Skills (8 Gates)
Sempre que editar ou criar habilidades, valide a conformidade técnica rodando:
```bash
python scripts/quick_validate.py skills/aiox-vibe-framework --verbose
```

### 2. Validador do Workspace
Para auditar se um diretório de projeto (como o site da Incise ou Vete do Rim) possui a estrutura mínima obrigatória (Constitution, Stories, PRD, AGENTS):
```bash
python skills/aiox-vibe-framework/scripts/check_workspace.py <caminho-do-projeto>
```

---

## 🏛️ Roteamento de X-Squads Integrados

A Skill principal possui roteamento nativo mapeado para carregar as competências consolidadas no diretório de recursos [`C:\Users\acast\PROJETOS\.x-squads\squad-prompts - cópia/`](file:///C:/Users/acast/PROJETOS/.x-squads/squad-prompts%20-%20c%C3%B3pia):
- **Advisory Board**: Planejamento e conselho estratégico.
- **Brand Squad**: Naming, marca e posicionamento.
- **C-Level Squad**: Alinhamento executivo e de direções técnicas.
- **Claude Code Mastery**: MCP, ferramentas de IA e otimização de prompts.
- **Copy Master / Copy Squad**: E-mails de conversão, anúncios e VSLs.
- **Cybersecurity**: Auditoria de segurança, pentests e LGPD.
- **Data Squad**: Growth hacking, analítica de funil e SQL.
- **Design Squad**: Criação de layouts, Design Systems e UX.
- **Hormozi Squad**: Estruturação de ofertas de vendas e atração de leads.
- **Storytelling**: Criação de pitches e apresentações.
- **Traffic Masters**: Gestão de campanhas em Meta/Google Ads.
