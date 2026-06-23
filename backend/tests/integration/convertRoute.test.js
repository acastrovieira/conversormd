/**
 * Testes de Integração — Rota POST /api/convert
 * @description Testa o endpoint de conversão de ponta a ponta usando supertest.
 *              Usa mocks para o geminiService, mas testa o middleware Express
 *              real (multer, CORS, validação, error handling) sem chamadas à API.
 * @module tests/integration/convertRoute.test
 *
 * Squad: @qa + @devops
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Configura chave mockada do servidor para evitar erro 401 durante os testes de integração
process.env.GEMINI_API_KEY = 'mock-server-key';

// Mock do geminiService para isolar o teste de integração da API real
jest.mock('../../services/geminiService', () => ({
  transcribeDocument: jest.fn(),
  auditTranscription: jest.fn(),
  getMimeType: jest.requireActual('../../services/geminiService').getMimeType,
}));

const { transcribeDocument, auditTranscription } = require('../../services/geminiService');
const app = require('../../server');

// Cria arquivo temporário de teste (PDF falso para upload)
const FAKE_PDF_PATH = path.join(__dirname, '..', 'fixtures', 'fake_test.pdf');

beforeAll(() => {
  // Cria um arquivo PDF falso para os testes de upload
  fs.writeFileSync(FAKE_PDF_PATH, '%PDF-1.4 fake pdf content for testing');
});

afterAll(() => {
  // Limpa o arquivo temporário criado para os testes
  if (fs.existsSync(FAKE_PDF_PATH)) fs.unlinkSync(FAKE_PDF_PATH);
});

afterEach(() => jest.clearAllMocks());

// ─── Bloco 1: GET /api/health ─────────────────────────────────────────────────

describe('GET /api/health', () => {
  test('deve retornar status 200 e status "online"', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
  });

  test('deve retornar o timestamp atual (ISO 8601)', async () => {
    const before = new Date().toISOString();
    const res = await request(app).get('/api/health');
    expect(res.body.timestamp).toBeDefined();
    const responseTime = new Date(res.body.timestamp).getTime();
    expect(responseTime).toBeGreaterThanOrEqual(new Date(before).getTime() - 1000);
  });

  test('deve indicar que a API key está com status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.geminiApiKey).toBeDefined();
  });
});

// ─── Bloco 2: POST /api/convert — Validação de Requisição ────────────────────

describe('POST /api/convert — validação de entrada', () => {
  test('deve retornar 400 quando nenhum arquivo é enviado', async () => {
    const res = await request(app)
      .post('/api/convert')
      .set('Content-Type', 'multipart/form-data');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  test('deve retornar erro quando o tipo de arquivo não é suportado', async () => {
    const res = await request(app)
      .post('/api/convert')
      .attach('document', Buffer.from('arquivo txt'), {
        filename: 'teste.txt',
        contentType: 'text/plain',
      });

    // Multer rejeita o tipo — espera status de erro
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Bloco 3: POST /api/convert — Fluxo Feliz ────────────────────────────────

describe('POST /api/convert — fluxo completo bem-sucedido', () => {
  const MOCK_MARKDOWN = '## Hemograma\n\n| Exame | Resultado |\n|---|---|\n| Hemoglobina | 14,2 g/dL |';
  const MOCK_AUDIT = {
    status: 'APROVADO',
    confianca: 0.97,
    total_divergencias: 0,
    divergencias: [],
    observacoes: 'Transcrição aprovada.',
  };

  beforeEach(() => {
    transcribeDocument.mockResolvedValue(MOCK_MARKDOWN);
    auditTranscription.mockResolvedValue(MOCK_AUDIT);
  });

  test('deve retornar status 200 e success: true', async () => {
    const res = await request(app)
      .post('/api/convert')
      .attach('document', FAKE_PDF_PATH, {
        filename: 'hemograma.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('deve retornar o campo originalFileName', async () => {
    const res = await request(app)
      .post('/api/convert')
      .attach('document', FAKE_PDF_PATH, {
        filename: 'hemograma.pdf',
        contentType: 'application/pdf',
      });

    expect(res.body.originalFileName).toBe('hemograma.pdf');
  });

  test('deve retornar o array "parts" com pelo menos 1 elemento', async () => {
    const res = await request(app)
      .post('/api/convert')
      .attach('document', FAKE_PDF_PATH, {
        filename: 'hemograma.pdf',
        contentType: 'application/pdf',
      });

    expect(Array.isArray(res.body.parts)).toBe(true);
    expect(res.body.parts.length).toBeGreaterThan(0);
  });

  test('cada parte deve conter filename, content, partNumber e totalParts', async () => {
    const res = await request(app)
      .post('/api/convert')
      .attach('document', FAKE_PDF_PATH, {
        filename: 'hemograma.pdf',
        contentType: 'application/pdf',
      });

    const part = res.body.parts[0];
    expect(part.filename).toBeDefined();
    expect(part.content).toBeDefined();
    expect(part.partNumber).toBe(1);
    expect(part.totalParts).toBeDefined();
  });

  test('deve retornar o objeto "audit" com status e divergencias', async () => {
    const res = await request(app)
      .post('/api/convert')
      .attach('document', FAKE_PDF_PATH, {
        filename: 'hemograma.pdf',
        contentType: 'application/pdf',
      });

    expect(res.body.audit).toBeDefined();
    expect(res.body.audit.status).toBe('APROVADO');
    expect(res.body.audit.total_divergencias).toBe(0);
    expect(Array.isArray(res.body.audit.divergencias)).toBe(true);
  });

  test('deve chamar transcribeDocument e auditTranscription exatamente 1 vez cada', async () => {
    await request(app)
      .post('/api/convert')
      .attach('document', FAKE_PDF_PATH, {
        filename: 'hemograma.pdf',
        contentType: 'application/pdf',
      });

    expect(transcribeDocument).toHaveBeenCalledTimes(1);
    expect(auditTranscription).toHaveBeenCalledTimes(1);
  });
});

// ─── Bloco 4: POST /api/convert — Tratamento de Erros da API ─────────────────

describe('POST /api/convert — erros internos do pipeline', () => {
  test('deve retornar status 500 quando a Fase 1 (transcrição) falha', async () => {
    transcribeDocument.mockRejectedValue(new Error('Falha de conexão com a API do Gemini'));
    auditTranscription.mockResolvedValue({ status: 'APROVADO' });

    const res = await request(app)
      .post('/api/convert')
      .attach('document', FAKE_PDF_PATH, {
        filename: 'laudo.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Gemini');
  });

  test('deve retornar status 500 quando a Fase 2 (auditoria) falha', async () => {
    transcribeDocument.mockResolvedValue('## Conteúdo OK');
    auditTranscription.mockRejectedValue(new Error('Erro na auditoria'));

    const res = await request(app)
      .post('/api/convert')
      .attach('document', FAKE_PDF_PATH, {
        filename: 'laudo.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  test('a resposta de erro deve sempre ter success: false', async () => {
    transcribeDocument.mockRejectedValue(new Error('API offline'));

    const res = await request(app)
      .post('/api/convert')
      .attach('document', FAKE_PDF_PATH, {
        filename: 'laudo.pdf',
        contentType: 'application/pdf',
      });

    expect(res.body.success).toBe(false);
  });
});
