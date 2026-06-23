/**
 * Multi-Model Service Router — Conversor MD
 * @description Roteador central que despacha as chamadas para o provedor selecionado
 *              (Gemini, OpenAI ou Claude).
 * @module services/multiModelService
 */

const { transcribeDocument: transcribeGemini, auditTranscription: auditGemini } = require('./geminiService');
const { transcribeDocumentOpenAI: transcribeOpenAI, auditTranscriptionOpenAI: auditOpenAI } = require('./openaiService');
const { transcribeDocumentClaude: transcribeClaude, auditTranscriptionClaude: auditClaude } = require('./claudeService');

/**
 * Roteia a chamada de transcrição para o provedor adequado.
 *
 * @param {string} filePath - Caminho do arquivo original
 * @param {string} originalFileName - Nome original do arquivo
 * @param {string} provider - Provedor de LLM ('gemini' | 'openai' | 'claude')
 * @param {string} apiKey - Chave de API enviada pelo cliente
 * @param {string} [extractedText] - Texto extraído (opcional)
 * @returns {Promise<string>} - Markdown transcrito
 */
async function transcribeDocument(filePath, originalFileName, provider, apiKey, extractedText = null) {
  const llm = (provider || 'gemini').toLowerCase();

  switch (llm) {
    case 'openai':
      console.log(`[ROTEADOR] Usando OpenAI para transcrição de: ${originalFileName}`);
      return await transcribeOpenAI(filePath, originalFileName, apiKey, extractedText);
    case 'claude':
      console.log(`[ROTEADOR] Usando Claude para transcrição de: ${originalFileName}`);
      return await transcribeClaude(filePath, originalFileName, apiKey, extractedText);
    case 'gemini':
    default:
      console.log(`[ROTEADOR] Usando Gemini para transcrição de: ${originalFileName}`);
      return await transcribeGemini(filePath, originalFileName, apiKey);
  }
}

/**
 * Roteia a chamada de auditoria para o provedor adequado.
 *
 * @param {string} markdownText - Markdown gerado na Fase 1
 * @param {string} filePath - Caminho do arquivo original
 * @param {string} originalFileName - Nome original do arquivo
 * @param {string} provider - Provedor de LLM ('gemini' | 'openai' | 'claude')
 * @param {string} apiKey - Chave de API enviada pelo cliente
 * @param {string} [extractedText] - Texto extraído (opcional)
 * @returns {Promise<Object>} - Relatório de auditoria formatado
 */
async function auditTranscription(markdownText, filePath, originalFileName, provider, apiKey, extractedText = null) {
  const llm = (provider || 'gemini').toLowerCase();

  switch (llm) {
    case 'openai':
      console.log(`[ROTEADOR] Usando OpenAI para auditoria de: ${originalFileName}`);
      return await auditOpenAI(markdownText, filePath, originalFileName, apiKey, extractedText);
    case 'claude':
      console.log(`[ROTEADOR] Usando Claude para auditoria de: ${originalFileName}`);
      return await auditClaude(markdownText, filePath, originalFileName, apiKey, extractedText);
    case 'gemini':
    default:
      console.log(`[ROTEADOR] Usando Gemini para auditoria de: ${originalFileName}`);
      return await auditGemini(markdownText, filePath, originalFileName, apiKey);
  }
}

module.exports = {
  transcribeDocument,
  auditTranscription
};
