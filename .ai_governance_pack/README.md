# AI Governance Pack

Pacote inicial para aplicar regras gerais, guardrails, controle de custo e configuração de agentes em projetos de IA.

## Arquivos

- GLOBAL_GUARDRAILS.md — regras gerais universais
- GLOBAL_GUARDRAILS.json — versão programática para backend, agentes e automações
- COST_RULES.md — regras específicas de controle de tokens e custos
- AGENT_TEMPLATE.md — modelo base para criação de novos agentes

## Como usar

1. Cole o GLOBAL_GUARDRAILS.md nas instruções principais do agente.
2. Use o GLOBAL_GUARDRAILS.json no backend, middleware ou automação.
3. Use o COST_RULES.md em todo projeto que consome API paga.
4. Copie o AGENT_TEMPLATE.md para criar agentes específicos.
