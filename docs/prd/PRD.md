# Product Requirements Document (PRD) - Conversor MD

**Versão:** 1.0.0  
**Data:** 2026-06-23  
**Status:** Em Revisão  
**Autor:** AIOX Product Team  

---

## 1. Visão Geral do Produto
O **Conversor MD** é um aplicativo web local de alta fidelidade desenvolvido para converter arquivos complexos (PDFs, Word, DOCX, Imagens) em arquivos formatados em Markdown (`.md`). O produto é projetado especificamente para atender a casos de uso de Inteligência Artificial/LLMs, onde a fidelidade literal dos dados estruturados (valores de exames, diagnósticos, laudos) é crítica e nenhuma alucinação ou alteração pode ocorrer.

---

## 2. Requisitos de Negócio e LGPD
1. **Conformidade de Privacidade (LGPD/HIPAA):** Todos os dados de saúde e laudos médicos devem ser processados de forma privada. O fluxo de dados será local (cliente e servidor local no computador do usuário) com chamadas diretas via HTTPS para a API do Gemini Pro, garantindo que os dados não sejam retidos ou utilizados para treinamento de terceiros.
2. **Fidelidade Literal de Dados:** O sistema não interpreta clinicamente nem resume o conteúdo. Ele deve fazer a transcrição exata dos dados brutos, tabelas e cabeçalhos.

---

## 3. Requisitos Funcionais

### RF-01: Upload de Documentos
- O sistema deve aceitar arquivos nos formatos: `.pdf`, `.docx`, `.doc`, `.png`, `.jpg`, `.jpeg`.
- Deve suportar múltiplos arquivos e área de arraste (Drag-and-Drop).

### RF-02: Transcrição via Gemini 1.5 Pro
- Integração direta com a API do Gemini 1.5 Pro (multimodal de imagem e documento).
- Foco absoluto nos dados brutos. Carimbos, assinaturas digitais/manuais e logotipos devem ser descartados da transcrição final.
- Trechos ilegíveis, borrados ou corrompidos na imagem/PDF original devem ser marcados estritamente como `[Trecho Ilegível]`.

### RF-03: Divisão Inteligente de Texto (Smart Splitting)
- O limite máximo de caracteres por arquivo `.md` de saída é de **5.000 caracteres**.
- Caso o resultado da transcrição ultrapasse 5.000 caracteres:
  - O sistema dividirá o texto em 2 ou mais partes lógicas.
  - A quebra deve ocorrer em pontos de quebra estrutural (como fim de uma frase com ponto final, fim de um parágrafo ou fim de uma tabela) antes do limite de 5.000 caracteres.
  - Cada arquivo gerado deve conter metadados em comentário Markdown vinculando as partes (ex: `<!-- ORIGEM: laudo.pdf | PARTE: 1 de 2 -->`).

### RF-04: Pipeline de Dupla Checagem (Double Check)
- Após a transcrição, um segundo agente de QA executará uma etapa de auditoria:
  - O agente receberá o Markdown gerado e a imagem/PDF original.
  - O agente apontará se existem divergências numéricas, nomes trocados ou possíveis alucinações.
  - Caso haja divergências, elas serão retornadas em um relatório de controle de segurança.

### RF-05: Interface Visual e Auditoria Lado a Lado
- Visualizador duplo: Documento original (PDF/Imagem) de um lado e o Markdown formatado do outro.
- Destaque visual dos pontos de controle de segurança e alertas indicados pelo Double Check.
- Botão de download simples para os arquivos `.md` divididos.

---

## 4. Requisitos Não-Funcionais

### RNF-01: Desempenho e Latência
- O tempo total de conversão e checagem não deve ultrapassar 45 segundos por arquivo médio (1 a 3 páginas).

### RNF-02: Segurança Local
- As chaves de API do Gemini serão mantidas localmente em um arquivo `.env` na máquina do usuário, nunca expostas publicamente.

### RNF-03: Portabilidade
- O frontend será em React + Vite, e o backend em Node.js local, permitindo fácil execução em sistemas Windows, macOS e Linux.
