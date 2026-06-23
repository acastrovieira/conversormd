/**
 * Testes Unitários — Gemini Service (Mocked)
 * @description Testa o fluxo do geminiService sem fazer chamadas reais à API.
 *              Usa Jest mocks para simular as respostas do SDK do Gemini.
 *              Garante que o service lida corretamente com:
 *              - Respostas bem-sucedidas (Fase 1 e Fase 2)
 *              - Respostas vazias da API
 *              - JSON malformado na auditoria
 *              - Mapeamento correto de MIME types
 * @module tests/unit/geminiService.test
 *
 * Squad: @qa + cybersecurity → AppSec Engineer
 */

// Seta a chave de API falsa antes de importar o service
process.env.GEMINI_API_KEY = 'FAKE_KEY_FOR_TESTS';

// Mock do SDK do Google Generative AI
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn();
  const mockGetGenerativeModel = jest.fn(() => ({
    generateContent: mockGenerateContent,
  }));

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
    _mockGenerateContent: mockGenerateContent, // Expõe o mock para os testes
  };
});

// Mock do fs para evitar leitura real de arquivos
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(() => Buffer.from('fake_file_content')),
  existsSync: jest.fn(() => true),
  unlinkSync: jest.fn(),
}));

const { GoogleGenerativeAI, _mockGenerateContent } = require('@google/generative-ai');
const { transcribeDocument, auditTranscription, getMimeType } = require('../../services/geminiService');
const { AUDIT_APROVADO, AUDIT_COM_DIVERGENCIAS } = require('../fixtures/testFixtures');

// ─── Bloco 1: getMimeType ─────────────────────────────────────────────────────

describe('getMimeType()', () => {
  test('deve retornar application/pdf para .pdf', () => {
    expect(getMimeType('laudo.pdf')).toBe('application/pdf');
  });

  test('deve retornar image/png para .png', () => {
    expect(getMimeType('foto.png')).toBe('image/png');
  });

  test('deve retornar image/jpeg para .jpg', () => {
    expect(getMimeType('exame.jpg')).toBe('image/jpeg');
  });

  test('deve retornar image/jpeg para .jpeg', () => {
    expect(getMimeType('exame.jpeg')).toBe('image/jpeg');
  });

  test('deve retornar image/webp para .webp', () => {
    expect(getMimeType('captura.webp')).toBe('image/webp');
  });

  test('deve retornar MIME correto para .docx', () => {
    expect(getMimeType('relatorio.docx')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });

  test('deve retornar application/octet-stream para extensão desconhecida', () => {
    expect(getMimeType('arquivo.xyz')).toBe('application/octet-stream');
  });

  test('deve ser case-insensitive para extensões em maiúsculo', () => {
    expect(getMimeType('LAUDO.PDF')).toBe('application/pdf');
  });
});

// ─── Bloco 2: transcribeDocument — Fluxo Feliz ───────────────────────────────

describe('transcribeDocument() — fluxo bem-sucedido', () => {
  beforeEach(() => {
    _mockGenerateContent.mockResolvedValue({
      response: { text: () => '## Hemograma\n\n| Exame | Resultado |\n|---|---|\n| Hemoglobina | 14,2 g/dL |' },
    });
  });

  afterEach(() => jest.clearAllMocks());

  test('deve retornar string Markdown não vazia', async () => {
    const result = await transcribeDocument('/fake/path/laudo.pdf', 'laudo.pdf');
    expect(typeof result).toBe('string');
    expect(result.trim().length).toBeGreaterThan(0);
  });

  test('o resultado deve conter conteúdo Markdown com tabela', async () => {
    const result = await transcribeDocument('/fake/path/laudo.pdf', 'laudo.pdf');
    expect(result).toContain('| Exame | Resultado |');
    expect(result).toContain('Hemoglobina');
  });

  test('deve chamar o SDK do Gemini exatamente 1 vez', async () => {
    await transcribeDocument('/fake/path/laudo.pdf', 'laudo.pdf');
    expect(_mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  test('deve fazer trim do resultado retornado pelo SDK', async () => {
    _mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => '   ## Resultado\n\nNormal.   ' },
    });
    const result = await transcribeDocument('/fake/path/laudo.pdf', 'laudo.pdf');
    expect(result).not.toMatch(/^\s/);
    expect(result).not.toMatch(/\s$/);
  });
});

// ─── Bloco 3: transcribeDocument — Tratamento de Erros ──────────────────────

describe('transcribeDocument() — tratamento de erros', () => {
  afterEach(() => jest.clearAllMocks());

  test('deve lançar erro quando a API retorna texto vazio', async () => {
    _mockGenerateContent.mockResolvedValue({
      response: { text: () => '' },
    });
    await expect(
      transcribeDocument('/fake/path/laudo.pdf', 'laudo.pdf')
    ).rejects.toThrow('O Gemini retornou uma resposta vazia');
  });

  test('deve lançar erro quando a API retorna apenas espaços em branco', async () => {
    _mockGenerateContent.mockResolvedValue({
      response: { text: () => '   \n\n   ' },
    });
    await expect(
      transcribeDocument('/fake/path/laudo.pdf', 'laudo.pdf')
    ).rejects.toThrow('O Gemini retornou uma resposta vazia');
  });

  test('deve propagar erro quando o SDK lança exceção de rede', async () => {
    _mockGenerateContent.mockRejectedValue(new Error('Network timeout'));
    await expect(
      transcribeDocument('/fake/path/laudo.pdf', 'laudo.pdf')
    ).rejects.toThrow('Network timeout');
  });
});

// ─── Bloco 4: auditTranscription — Fluxo Feliz ───────────────────────────────

describe('auditTranscription() — fluxo bem-sucedido', () => {
  afterEach(() => jest.clearAllMocks());

  test('deve retornar objeto de auditoria com status APROVADO', async () => {
    _mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(AUDIT_APROVADO) },
    });

    const result = await auditTranscription('## MD', '/fake/path/laudo.pdf', 'laudo.pdf');
    expect(result.status).toBe('APROVADO');
    expect(result.total_divergencias).toBe(0);
    expect(Array.isArray(result.divergencias)).toBe(true);
  });

  test('deve retornar objeto de auditoria com divergências quando existem', async () => {
    _mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(AUDIT_COM_DIVERGENCIAS) },
    });

    const result = await auditTranscription('## MD errado', '/fake/path/laudo.pdf', 'laudo.pdf');
    expect(result.status).toBe('REQUER_REVISAO');
    expect(result.total_divergencias).toBe(2);
    expect(result.divergencias[0].tipo).toBe('numero_incorreto');
  });

  test('deve extrair JSON mesmo quando a API inclui bloco ```json```', async () => {
    _mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          '```json\n' + JSON.stringify(AUDIT_APROVADO) + '\n```',
      },
    });

    const result = await auditTranscription('## MD', '/fake/path/laudo.pdf', 'laudo.pdf');
    expect(result.status).toBe('APROVADO');
  });
});

// ─── Bloco 5: auditTranscription — Tratamento de JSON Malformado ─────────────

describe('auditTranscription() — JSON malformado ou ausente', () => {
  afterEach(() => jest.clearAllMocks());

  test('deve retornar status ERRO_AUDITORIA quando a API não retorna JSON', async () => {
    _mockGenerateContent.mockResolvedValue({
      response: { text: () => 'Não consegui comparar os documentos.' },
    });

    const result = await auditTranscription('## MD', '/fake/path/laudo.pdf', 'laudo.pdf');
    expect(result.status).toBe('ERRO_AUDITORIA');
    expect(result.total_divergencias).toBe(0);
  });

  test('deve retornar status ERRO_AUDITORIA quando o JSON está corrompido', async () => {
    _mockGenerateContent.mockResolvedValue({
      response: { text: () => '{ "status": "APROVADO", "confianca": ' }, // JSON incompleto
    });

    const result = await auditTranscription('## MD', '/fake/path/laudo.pdf', 'laudo.pdf');
    expect(result.status).toBe('ERRO_AUDITORIA');
  });

  test('ERRO_AUDITORIA deve conter observação para revisão manual', async () => {
    _mockGenerateContent.mockResolvedValue({
      response: { text: () => 'texto sem json' },
    });

    const result = await auditTranscription('## MD', '/fake/path/laudo.pdf', 'laudo.pdf');
    expect(result.observacoes.toLowerCase()).toContain('manualmente');
  });
});
