/**
 * Claude Service — Conversor MD
 * @description Integração com a API da Anthropic (Claude 3.5 Sonnet) para transcrição e auditoria.
 * @module services/claudeService
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const { TRANSCRIPTION_PROMPT, AUDIT_PROMPT } = require('../prompts/converterPrompts');

const MODEL_NAME = 'claude-3-5-sonnet-20241022';

/**
 * Transcreve uma imagem, PDF ou texto usando o Claude 3.5 Sonnet.
 *
 * @param {string} filePath - Caminho do arquivo original
 * @param {string} originalFileName - Nome original do arquivo
 * @param {string} apiKey - Chave da API do Claude
 * @param {string} [extractedText] - Texto extraído (opcional, para DOCX)
 * @returns {Promise<string>} - Markdown transcrito
 */
async function transcribeDocumentClaude(filePath, originalFileName, apiKey, extractedText = null) {
  const anthropic = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
  const ext = path.extname(originalFileName).toLowerCase();
  const fileData = fs.readFileSync(filePath);
  const fileBase64 = fileData.toString('base64');

  let content = [];

  if (ext === '.docx' && extractedText) {
    content = [
      {
        type: 'text',
        text: `${TRANSCRIPTION_PROMPT}\n\nAqui está o texto bruto extraído do documento:\n\n${extractedText}`
      }
    ];
  } else if (ext === '.pdf') {
    content = [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: fileBase64
        }
      },
      {
        type: 'text',
        text: TRANSCRIPTION_PROMPT
      }
    ];
  } else {
    // Imagens
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    content = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType,
          data: fileBase64
        }
      },
      {
        type: 'text',
        text: TRANSCRIPTION_PROMPT
      }
    ];
  }

  const response = await anthropic.messages.create({
    model: MODEL_NAME,
    max_tokens: 4000,
    messages: [
      { role: 'user', content }
    ],
    temperature: 0.1,
  });

  const text = response.content[0].text;
  if (!text || text.trim().length === 0) {
    throw new Error('O Claude retornou uma resposta vazia para o documento fornecido.');
  }

  return text.trim();
}

/**
 * Realiza auditoria usando o Claude 3.5 Sonnet.
 *
 * @param {string} markdownText - Markdown gerado na Fase 1
 * @param {string} filePath - Caminho do arquivo original
 * @param {string} originalFileName - Nome original do arquivo
 * @param {string} apiKey - Chave da API do Claude
 * @param {string} [extractedText] - Texto extraído (opcional, para DOCX)
 * @returns {Promise<Object>} - Relatório de auditoria formatado
 */
async function auditTranscriptionClaude(markdownText, filePath, originalFileName, apiKey, extractedText = null) {
  const anthropic = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
  const ext = path.extname(originalFileName).toLowerCase();
  const fileData = fs.readFileSync(filePath);
  const fileBase64 = fileData.toString('base64');

  let content = [];

  if (ext === '.docx' && extractedText) {
    content = [
      {
        type: 'text',
        text: `${AUDIT_PROMPT}\n\n--- DOCUMENTO ORIGINAL (TEXTO) ---\n${extractedText}\n\n--- MARKDOWN TRANSCRITO ---\n${markdownText}`
      }
    ];
  } else if (ext === '.pdf') {
    content = [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: fileBase64
        }
      },
      {
        type: 'text',
        text: `${AUDIT_PROMPT}\n\n--- MARKDOWN TRANSCRITO ---\n${markdownText}`
      }
    ];
  } else {
    // Imagens
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    content = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType,
          data: fileBase64
        }
      },
      {
        type: 'text',
        text: `${AUDIT_PROMPT}\n\n--- MARKDOWN TRANSCRITO ---\n${markdownText}`
      }
    ];
  }

  const response = await anthropic.messages.create({
    model: MODEL_NAME,
    max_tokens: 4000,
    messages: [
      { role: 'user', content }
    ],
    temperature: 0.1,
  });

  const rawResponse = response.content[0].text.trim();

  try {
    return JSON.parse(rawResponse);
  } catch (e) {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fallback
      }
    }
    return {
      status: 'ERRO_AUDITORIA',
      confianca: 0,
      total_divergencias: 0,
      divergencias: [],
      observacoes: 'Erro ao parsear o relatório de auditoria do Claude.',
    };
  }
}

module.exports = {
  transcribeDocumentClaude,
  auditTranscriptionClaude
};
