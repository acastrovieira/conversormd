/**
 * Rota de Conversão — Conversor MD
 * @description Endpoint principal POST /api/convert
 *              Recebe o arquivo, executa as duas fases de conversão e retorna o resultado.
 * @module routes/convertRoute
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { transcribeDocument, auditTranscription } = require('../services/multiModelService');
const { splitMarkdown } = require('../utils/smartSplitter');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Configuração do Multer — armazenamento temporário local
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    // Mantém o nome original com timestamp para evitar colisões
    const timestamp = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}_${safe}`);
  },
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
    }
  },
});

/**
 * POST /api/convert
 * Body: multipart/form-data com campo "document"
 * Response JSON: {
 *   success: boolean,
 *   originalFileName: string,
 *   parts: Array<{partNumber, totalParts, filename, content, charCount}>,
 *   audit: { status, confianca, total_divergencias, divergencias, observacoes }
 * }
 */
const uploadMiddleware = upload.single('document');

router.post('/', (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      // Erros do multer (tipo inválido, tamanho, etc.) → 400
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}, async (req, res) => {
  const tempFilePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo recebido.' });
    }

    // Lê os cabeçalhos de controle da IA
    const provider = req.headers['x-llm-provider'] || 'gemini';
    const apiKey = req.headers['x-api-key'] || req.headers['x-gemini-api-key'];

    const providerLower = provider.toLowerCase();
    let hasServerKey = false;
    
    if (providerLower === 'openai') {
      hasServerKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sua_chave_aqui';
    } else if (providerLower === 'claude') {
      hasServerKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sua_chave_aqui';
    } else {
      hasServerKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'sua_chave_aqui';
    }

    if (!apiKey && !hasServerKey) {
      return res.status(401).json({
        success: false,
        error: `Chave de API do ${provider.toUpperCase()} não fornecida. Configure a sua chave na interface ou no ambiente do servidor.`,
      });
    }

    const originalFileName = req.file.originalname;
    console.log(`[CONVERSÃO] Iniciando: ${originalFileName} (${req.file.size} bytes) usando ${provider.toUpperCase()}`);

    // Extração de texto para DOCX ou PDFs (caso o modelo seja OpenAI, que não aceita PDF em base64)
    const ext = path.extname(originalFileName).toLowerCase();
    let extractedText = null;

    if (ext === '.docx') {
      console.log(`[CONVERSÃO] Extraindo texto do arquivo Word: ${originalFileName}`);
      const docResult = await mammoth.extractRawText({ path: tempFilePath });
      extractedText = docResult.value;
    } else if (ext === '.pdf' && providerLower === 'openai') {
      console.log(`[CONVERSÃO] Extraindo texto de PDF para OpenAI: ${originalFileName}`);
      const dataBuffer = fs.readFileSync(tempFilePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    }

    // ─── FASE 1: Transcrição ───────────────────────────────────────────────
    console.log(`[FASE 1] Transcrevendo com ${provider.toUpperCase()}...`);
    const markdownFull = await transcribeDocument(tempFilePath, originalFileName, provider, apiKey, extractedText);
    console.log(`[FASE 1] Concluída — ${markdownFull.length} caracteres`);

    // ─── SMART SPLIT ───────────────────────────────────────────────────────
    const parts = splitMarkdown(markdownFull, originalFileName);
    console.log(`[SPLIT] ${parts.length} parte(s) gerada(s)`);

    // ─── FASE 2: Auditoria (Double Check) ─────────────────────────────────
    console.log(`[FASE 2] Executando auditoria com ${provider.toUpperCase()} (Double Check)...`);
    const audit = await auditTranscription(markdownFull, tempFilePath, originalFileName, provider, apiKey, extractedText);
    console.log(`[FASE 2] Auditoria concluída — Status: ${audit.status}`);

    return res.json({
      success: true,
      originalFileName,
      parts,
      audit,
    });

  } catch (error) {
    console.error('[ERRO] Falha na conversão:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno durante a conversão.',
    });

  } finally {
    // ─── LIMPEZA: Remove arquivo temporário ───────────────────────────────
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log(`[LIMPEZA] Arquivo temporário removido: ${path.basename(tempFilePath)}`);
    }
  }
});

module.exports = router;
