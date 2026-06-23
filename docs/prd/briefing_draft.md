# Briefing Inicial - Conversor MD (Fidelidade Absoluta)

Este documento reúne os requisitos coletados para o desenvolvimento do aplicativo de conversão de documentos para Markdown (`.md`), focado em uso com modelos de linguagem (LLMs).

---

## 🎯 Objetivo do Aplicativo
Converter arquivos de diferentes formatos (PDF, Word, DOCX, imagens/fotos de laudos e exames) em texto formatado no padrão Markdown (`.md`), garantindo **transcrição literal**, **zero alucinação** e **divisão inteligente de arquivos** baseado em limites de caracteres para consumo ideal por LLMs.

---

## 📋 Requisitos Críticos Coletados

### 1. Suporte a Imagens e Fotos de Celular
- **Decisão:** O sistema **irá suportar** leitura de imagens (JPEG, PNG).
- **Justificativa Técnica:** Utilizando modelos multimodais de visão (como Gemini 1.5 ou Claude 3.5), o processamento de imagens e PDFs escaneados compartilha a mesma infraestrutura, tornando a implementação de fotos muito viável e de baixo impacto no tempo de desenvolvimento.

### 2. Fidelidade Absoluta e Zero Alucinação (Medicina/Laudos)
- **Não interpretação**: O sistema não deve tentar resumir, reescrever, simplificar ou interpretar o texto dos laudos e exames laboratoriais.
- **Transcrição literal**: A leitura deve ser 100% fiel ao documento original.
- **Tratamento de trechos ilegíveis**: Se houver partes rasuradas, borradas ou de caligrafia impossível de ler, o sistema **nunca** deve deduzir ou inventar o conteúdo. Deve sinalizar explicitamente que o trecho está ilegível.

### 3. Divisão Inteligente (Smart Splitting)
- **Limite:** O arquivo `.md` resultante não pode exceder **5.000 caracteres**.
- **Quebra Inteligente:** Caso ultrapasse esse limite, o texto será dividido em dois ou mais blocos lógicos. A quebra **nunca** cortará palavras ou tags markdown no meio; ela identificará o último ponto final, parágrafo ou cabeçalho antes dos 5.000 caracteres para efetuar o corte.
- **Agrupamento de Arquivos:** Múltiplos arquivos gerados a partir do mesmo documento original devem ser facilmente identificáveis. Exemplo de nomenclatura:
  - `laudo_clinico_original.pdf` -> `laudo_clinico_original_part1.md`, `laudo_clinico_original_part2.md`.
  - Cada arquivo gerado conterá um cabeçalho markdown padronizado apontando sua relação (ex: `Parte 1 de 2 | Origem: laudo_clinico_original.pdf`).

### 4. Extração Máxima de Informação
- O sistema deve extrair o máximo de detalhes possível do documento original (metadados, cabeçalhos, tabelas de exames laboratoriais estruturadas) para enriquecer o contexto de uso em outras LLMs.

---

## 🔍 Propostas Técnicas sob Avaliação (Aguardando Retorno do Usuário)

### 🖥️ Tipo de Interface / Execução (Proposta do `@architect`)
- **Sugestão:** Uma **Web App Local** simples em React + Vite rodando no seu navegador com um drag-and-drop de arquivos para conversão, ou um script de terminal **CLI** caso você prefira automação em lote.

### 🧪 Tratamento de Elementos Gráficos (Proposta do `@qa`)
- **Proposta:**
  - Trechos borrados/ilegíveis seriam marcados como `[Trecho Ilegível]`.
  - Assinaturas/Carimbos seriam marcados como `[Assinatura Médica]` ou `[Carimbo CRM]`.
  - Gostaria de uma validação dupla (um modelo transcreve e outro modelo checa o texto final comparando com a imagem para verificar distorções)?

### 🔐 Segurança e LGPD (Proposta do `@devops`)
- **Proposta:** Utilização de APIs na nuvem com termos de privacidade estritos de desenvolvimento (onde dados não são guardados nem usados para treino de IA), garantindo conformidade com a LGPD e HIPAA.
