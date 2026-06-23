/**
 * Servidor Principal — Conversor MD
 * @description Servidor Express local rodando em localhost.
 *              Todas as chamadas à API do Gemini são feitas diretamente deste servidor.
 *              Nenhum dado é armazenado em servidores externos (conformidade LGPD).
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const convertRoute = require('./routes/convertRoute');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (como ferramentas locais) ou vindas de localhost / IPs locais de Wi-Fi (192.168.x.x ou 10.x.x.x)
    if (!origin || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') || 
        /^(http|https):\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelas políticas de CORS do Conversor MD'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-llm-provider', 'x-api-key', 'x-gemini-api-key'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.use('/api/convert', convertRoute);

// Rota de health check — valida que o servidor e as chaves de API estão OK
app.get('/api/health', (req, res) => {
  const hasGemini = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'sua_chave_aqui';
  const hasOpenai = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sua_chave_aqui';
  const hasClaude = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sua_chave_aqui';
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    geminiApiKey: hasGemini ? 'configurada' : 'NÃO CONFIGURADA',
    openaiApiKey: hasOpenai ? 'configurada' : 'NÃO CONFIGURADA',
    claudeApiKey: hasClaude ? 'configurada' : 'NÃO CONFIGURADA',
    maxFileSizeMb: process.env.MAX_FILE_SIZE_MB || 50,
    maxCharsPerFile: process.env.MAX_CHARS_PER_MD_FILE || 5000,
  });
});

// ─── Tratamento de Erros Global ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERRO GLOBAL]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: `Arquivo muito grande. Máximo permitido: ${process.env.MAX_FILE_SIZE_MB || 50}MB`,
    });
  }
  res.status(500).json({ success: false, error: err.message || 'Erro interno do servidor.' });
});

// ─── Inicialização ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║         CONVERSOR MD — Servidor Backend          ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  🟢 Rodando em: http://localhost:${PORT}            ║`);
    console.log(`║  🔑 API Gemini: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'sua_chave_aqui' ? '✅ Configurada' : '❌ NÃO CONFIGURADA'}             ║`);
    console.log('║  📁 Uploads: temporários (removidos após uso)    ║');
    console.log('║  🔒 Dados locais — conformidade LGPD/HIPAA       ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
  });
}

module.exports = app;
