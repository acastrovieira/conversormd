/**
 * Gemini Service — Conversor MD
 * @description Serviço de integração com a API do Gemini 1.5 Pro.
 *              Implementa o pipeline de duas fases:
 *              Fase 1: Transcrição fiel (texto/imagem → Markdown)
 *              Fase 2: Auditoria de qualidade (Double Check)
 * @module services/geminiService
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { TRANSCRIPTION_PROMPT, AUDIT_PROMPT } = require('../prompts/converterPrompts');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modelo principal para transcrição e auditoria
const MODEL_NAME = 'gemini-1.5-pro';

/**
 * Converte um arquivo de imagem ou PDF em uma parte inline para a API do Gemini.
 *
 * @param {string} filePath - Caminho absoluto do arquivo
 * @param {string} mimeType - MIME type do arquivo
 * @returns {{inlineData: {data: string, mimeType: string}}}
 */
function fileToGenerativePart(filePath, mimeType) {
  const fileData = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: fileData.toString('base64'),
      mimeType,
    },
  };
}

/**
 * Mapeia a extensão do arquivo para o MIME type correto.
 *
 * @param {string} filename - Nome do arquivo
 * @returns {string} MIME type
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap = {
    '.pdf':  'application/pdf',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc':  'application/msword',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * FASE 1 — Transcrição Fiel
 * Envia o arquivo para o Gemini 1.5 Pro e retorna a transcrição Markdown literal.
 *
 * @param {string} filePath - Caminho do arquivo no disco
 * @param {string} originalFileName - Nome original do arquivo
 * @returns {Promise<string>} - Texto Markdown transcrito
 */
async function transcribeDocument(filePath, originalFileName, apiKey) {
  const client = apiKey ? new GoogleGenerativeAI(apiKey) : genAI;
  const model = client.getGenerativeModel({ model: MODEL_NAME });
  const mimeType = getMimeType(originalFileName);

  const filePart = fileToGenerativePart(filePath, mimeType);

  const result = await model.generateContent([
    TRANSCRIPTION_PROMPT,
    filePart,
  ]);

  const response = result.response;
  const text = response.text();

  if (!text || text.trim().length === 0) {
    throw new Error('O Gemini retornou uma resposta vazia para o documento fornecido.');
  }

  return text.trim();
}

/**
 * FASE 2 — Auditoria de Qualidade (Double Check)
 * Compara o Markdown gerado com o documento original e retorna um relatório JSON.
 *
 * @param {string} markdownText - Markdown gerado na Fase 1
 * @param {string} filePath - Caminho do arquivo original para comparação visual
 * @param {string} originalFileName - Nome original do arquivo
 * @param {string} [apiKey] - Chave da API do Gemini enviada pelo cliente (opcional)
 * @returns {Promise<Object>} - Relatório de auditoria estruturado
 */
async function auditTranscription(markdownText, filePath, originalFileName, apiKey) {
  const client = apiKey ? new GoogleGenerativeAI(apiKey) : genAI;
  const model = client.getGenerativeModel({ model: MODEL_NAME });
  const mimeType = getMimeType(originalFileName);

  const filePart = fileToGenerativePart(filePath, mimeType);

  const auditRequest = [
    AUDIT_PROMPT,
    `\n\n--- MARKDOWN TRANSCRITO ---\n${markdownText}\n--- FIM DO MARKDOWN ---`,
    filePart,
  ];

  const result = await model.generateContent(auditRequest);
  const rawResponse = result.response.text().trim();

  // Extrai apenas o bloco JSON da resposta (previne prefixos como "```json")
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      status: 'ERRO_AUDITORIA',
      confianca: 0,
      total_divergencias: 0,
      divergencias: [],
      observacoes: 'Não foi possível processar o relatório de auditoria. Revise manualmente.',
    };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      status: 'ERRO_AUDITORIA',
      confianca: 0,
      total_divergencias: 0,
      divergencias: [],
      observacoes: 'Erro ao parsear o JSON de auditoria. Revise manualmente.',
    };
  }
}

module.exports = { transcribeDocument, auditTranscription, getMimeType };
