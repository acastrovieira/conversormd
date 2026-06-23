/**
 * OpenAI Service — Conversor MD
 * @description Integração com a API da OpenAI (GPT-4o) para transcrição e auditoria.
 * @module services/openaiService
 */

const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const { TRANSCRIPTION_PROMPT, AUDIT_PROMPT } = require('../prompts/converterPrompts');

/**
 * Transcreve uma imagem ou texto extraído usando o GPT-4o.
 *
 * @param {string} filePath - Caminho do arquivo original
 * @param {string} originalFileName - Nome original do arquivo
 * @param {string} apiKey - Chave da API da OpenAI
 * @param {string} [extractedText] - Texto extraído (para PDFs ou DOCX)
 * @returns {Promise<string>} - Markdown transcrito
 */
async function transcribeDocumentOpenAI(filePath, originalFileName, apiKey, extractedText = null) {
  const openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  let messages = [];

  if (extractedText) {
    messages = [
      { role: 'system', content: 'Você é um sistema de transcrição documental de alta precisão.' },
      { role: 'user', content: `${TRANSCRIPTION_PROMPT}\n\nAqui está o texto bruto extraído do documento:\n\n${extractedText}` }
    ];
  } else {
    const imageBase64 = fs.readFileSync(filePath).toString('base64');
    const ext = path.extname(originalFileName).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

    messages = [
      { role: 'system', content: 'Você é um sistema de transcrição documental de alta precisão.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: TRANSCRIPTION_PROMPT },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`
            }
          }
        ]
      }
    ];
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.1,
  });

  const text = response.choices[0].message.content;
  if (!text || text.trim().length === 0) {
    throw new Error('A OpenAI retornou uma resposta vazia para o documento fornecido.');
  }

  return text.trim();
}

/**
 * Realiza auditoria usando o GPT-4o.
 *
 * @param {string} markdownText - Markdown gerado na Fase 1
 * @param {string} filePath - Caminho do arquivo original
 * @param {string} originalFileName - Nome original do arquivo
 * @param {string} apiKey - Chave da API da OpenAI
 * @param {string} [extractedText] - Texto extraído (para PDFs ou DOCX)
 * @returns {Promise<Object>} - Relatório de auditoria formatado
 */
async function auditTranscriptionOpenAI(markdownText, filePath, originalFileName, apiKey, extractedText = null) {
  const openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  let messages = [];

  if (extractedText) {
    messages = [
      { role: 'system', content: 'Você é um auditor de qualidade especializado em transcrições de documentos médicos.' },
      {
        role: 'user',
        content: `${AUDIT_PROMPT}\n\n--- DOCUMENTO ORIGINAL (TEXTO) ---\n${extractedText}\n\n--- MARKDOWN TRANSCRITO ---\n${markdownText}`
      }
    ];
  } else {
    const imageBase64 = fs.readFileSync(filePath).toString('base64');
    const ext = path.extname(originalFileName).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

    messages = [
      { role: 'system', content: 'Você é um auditor de qualidade especializado em transcrições de documentos médicos.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: `${AUDIT_PROMPT}\n\n--- MARKDOWN TRANSCRITO ---\n${markdownText}` },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`
            }
          }
        ]
      }
    ];
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const rawResponse = response.choices[0].message.content.trim();

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
      observacoes: 'Erro ao parsear o relatório de auditoria do GPT-4o.',
    };
  }
}

module.exports = {
  transcribeDocumentOpenAI,
  auditTranscriptionOpenAI
};
