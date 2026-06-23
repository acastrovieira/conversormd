# Compilação de Governança de IA e AIOX Core

Este documento compila as diretrizes de governança do [`C:\Users\acast\PROJETOS\.ai_governance_pack`](file:///C:/Users/acast/PROJETOS/.ai_governance_pack) e as regras de desenvolvimento do núcleo do [`C:\Users\acast\PROJETOS\.aiox-core`](file:///C:/Users/acast/PROJETOS/.aiox-core) para subsidiar as execuções de vibe coding.

---

## 🛡️ 1. Guardrails Globais de IA (Global Guardrails)

A segurança, a precisão e a verdade são os pilares inegociáveis nas interações com modelos de linguagem.

### Princípios de Execução
- **Precisão > Criatividade**: Os modelos devem agir com base em fatos provados, declarando incerteza imediatamente em caso de dados faltantes.
- **Hierarquia de Tomada de Decisão**:
  1. Segurança
  2. Verdade
  3. Conformidade
  4. Clareza
  5. Eficiência
  6. Criatividade
- **Prevenção de Alucinação**: É proibido inventar referências acadêmicas, dados estatísticos ou resultados operacionais.

### Segurança e Privacidade de Dados
- **Exposição Proibida**: Nunca expor ou persistir chaves de API, senhas, tokens ou dados clínicos/financeiros identificáveis de pessoas, tutores ou pacientes.
- **Mascaramento Obrigatório**: Aplicar técnicas de anonimização sob a LGPD para CPFs, telefones, e-mails, endereços e dados clínicos sensíveis.

### Política de Ações e Confirmações
- **Sem Confirmação (Permissões de Leitura)**: Consultas, resumos, classificação de textos, validações estruturais e escrita de rascunhos.
- **Confirmação Explícita Obrigatória (Mutação/Rede)**: Enviar e-mails/WhatsApp, exclusão física de arquivos, alteração direta em bancos de dados de produção, execução de transações financeiras e publicação de conteúdo.

---

## 💰 2. Controle de Custos e Tokens (Cost Rules)

Otimizar o uso de tokens reduz custos operacionais de API e previne estouro de orçamento.

- **Respostas Objetivas**: Limitar o tamanho das respostas aos dados estritamente necessários para a operação.
- **Orçamento por Projeto**: Cada execução deve ser monitorada e contabilizada em relação ao orçamento mensal configurado.
- **Limites de Contexto**: Contextos extensos de histórico devem ser resumidos e compactados para evitar consumo ocioso em janelas de contexto grandes.
- **Alertas de Orçamento**: Notificar o usuário quando o consumo atingir os gates de **50%**, **75%**, **90%** e **100%**. Chamadas não essenciais devem ser bloqueadas se o teto de 100% for excedido.

---

## 🏛️ 3. Padrões de Desenvolvimento do AIOX Core

As regras de engenharia que mantêm a integridade de repositórios legados e greenfield.

- **CLI First**: Toda nova feature deve ser operável via CLI antes de qualquer desenvolvimento de interface visual. A UI serve estritamente para observabilidade (visualizar dados), nunca para controle lógico.
- **Story-Driven Development**: Nenhum código pode ser escrito ou alterado sem estar vinculado a uma história registrada em `docs/stories/`.
- **Absolute Imports**: Uso do alias `@/` para imports globais para facilitar refatorações futuras de arquivos.
- **No Invention**: Toda alteração deve mapear para requisitos funcionais ou não-funcionais (FR/NFR) ratificados no `docs/prd.md`.
