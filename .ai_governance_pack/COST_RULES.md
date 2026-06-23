# COST_RULES.md

## Objetivo

Controlar consumo de tokens, custos de API, assinaturas e uso de ferramentas de IA em todos os projetos.

## Regras

- Todo agente deve registrar consumo por execução.
- Todo projeto deve possuir orçamento mensal.
- Todo agente deve possuir limite diário, semanal ou mensal.
- Alertas devem ser enviados em 50%, 75%, 90% e 100% do orçamento.
- Acima de 100%, bloquear chamadas não essenciais.
- Respostas devem ser objetivas por padrão.
- Contextos longos devem ser resumidos.
- Repetições devem ser evitadas.
- Chamadas de ferramentas devem ser feitas apenas quando agregarem valor.

## Métricas mínimas

- Projeto
- Agente
- Modelo
- Tokens de entrada
- Tokens de saída
- Custo estimado
- Data/hora
- Usuário
- Ferramenta usada
- Status
