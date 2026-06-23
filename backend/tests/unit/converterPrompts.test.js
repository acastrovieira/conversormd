/**
 * Testes Unitários — Prompts de Conversão
 * @description Valida a integridade e a presença das regras críticas nos prompts
 *              do pipeline de duas fases. Garante que nenhuma refatoração acidental
 *              remova regras de segurança clínica.
 * @module tests/unit/converterPrompts.test
 *
 * Squad: @qa (design dos critérios de segurança dos prompts)
 */

const { TRANSCRIPTION_PROMPT, AUDIT_PROMPT } = require('../../prompts/converterPrompts');

// ─── Bloco 1: Exportação e Estrutura ─────────────────────────────────────────

describe('converterPrompts — exportação e estrutura', () => {
  test('TRANSCRIPTION_PROMPT deve ser exportado como string não vazia', () => {
    expect(typeof TRANSCRIPTION_PROMPT).toBe('string');
    expect(TRANSCRIPTION_PROMPT.trim().length).toBeGreaterThan(100);
  });

  test('AUDIT_PROMPT deve ser exportado como string não vazia', () => {
    expect(typeof AUDIT_PROMPT).toBe('string');
    expect(AUDIT_PROMPT.trim().length).toBeGreaterThan(100);
  });
});

// ─── Bloco 2: TRANSCRIPTION_PROMPT — Regras de Fidelidade Clínica ────────────

describe('TRANSCRIPTION_PROMPT — regras de fidelidade clínica', () => {
  test('deve conter regra de proibição de invenção de dados', () => {
    expect(TRANSCRIPTION_PROMPT.toUpperCase()).toContain('NUNCA');
  });

  test('deve mencionar a marcação de trecho ilegível', () => {
    expect(TRANSCRIPTION_PROMPT).toContain('[Trecho Ilegível]');
  });

  test('deve instruir a ignorar assinaturas e carimbos', () => {
    const lower = TRANSCRIPTION_PROMPT.toLowerCase();
    expect(lower).toContain('assinatura');
    expect(lower).toContain('carimbo');
    expect(lower).toContain('logotipo');
  });

  test('deve mencionar o uso de tabelas Markdown para exames laboratoriais', () => {
    expect(TRANSCRIPTION_PROMPT).toContain('tabelas Markdown');
  });

  test('deve proibir explicitamente resumo ou interpretação', () => {
    const lower = TRANSCRIPTION_PROMPT.toLowerCase();
    const proibeResumo = lower.includes('resumo') || lower.includes('nunca resuma');
    expect(proibeResumo).toBe(true);
  });

  test('deve proibir adição de texto introdutório ou conclusão', () => {
    const lower = TRANSCRIPTION_PROMPT.toLowerCase();
    expect(lower).toContain('introdut');
  });

  test('deve mencionar foco em dados brutos (valores numéricos, datas, unidades)', () => {
    const lower = TRANSCRIPTION_PROMPT.toLowerCase();
    expect(lower).toContain('valores numéricos');
    expect(lower).toContain('unidades de medida');
  });
});

// ─── Bloco 3: AUDIT_PROMPT — Estrutura do JSON de Auditoria ──────────────────

describe('AUDIT_PROMPT — estrutura do relatório JSON de auditoria', () => {
  test('deve referenciar os dois status possíveis: APROVADO e REQUER_REVISAO', () => {
    expect(AUDIT_PROMPT).toContain('APROVADO');
    expect(AUDIT_PROMPT).toContain('REQUER_REVISAO');
  });

  test('deve especificar o campo "confianca" no schema JSON', () => {
    expect(AUDIT_PROMPT).toContain('"confianca"');
  });

  test('deve especificar o campo "total_divergencias" no schema JSON', () => {
    expect(AUDIT_PROMPT).toContain('"total_divergencias"');
  });

  test('deve especificar o campo "divergencias" (array) no schema JSON', () => {
    expect(AUDIT_PROMPT).toContain('"divergencias"');
  });

  test('deve listar os tipos de divergência clínica esperados', () => {
    expect(AUDIT_PROMPT).toContain('numero_incorreto');
    expect(AUDIT_PROMPT).toContain('omissao');
    expect(AUDIT_PROMPT).toContain('alucinacao');
    expect(AUDIT_PROMPT).toContain('unidade_incorreta');
    expect(AUDIT_PROMPT).toContain('nome_incorreto');
  });

  test('deve instruir retorno de JSON válido', () => {
    const lower = AUDIT_PROMPT.toLowerCase();
    expect(lower).toContain('json válido');
  });

  test('deve verificar números e valores numéricos divergentes', () => {
    const lower = AUDIT_PROMPT.toLowerCase();
    expect(lower).toContain('números');
  });

  test('deve verificar unidades de medida incorretas', () => {
    const lower = AUDIT_PROMPT.toLowerCase();
    expect(lower).toContain('unidades de medida');
  });

  test('deve verificar alucinações (texto inventado)', () => {
    expect(AUDIT_PROMPT.toLowerCase()).toContain('aluci');
  });

  test('deve especificar comportamento para caso sem divergências (status APROVADO)', () => {
    expect(AUDIT_PROMPT).toContain('total_divergencias 0');
  });
});

// ─── Bloco 4: Segurança — Os prompts NÃO devem vazar dados sensíveis ─────────

describe('converterPrompts — verificação de segurança dos prompts', () => {
  test('TRANSCRIPTION_PROMPT não deve conter chaves de API ou tokens hardcoded', () => {
    const suspiciousPatterns = [/AIza[0-9A-Za-z-_]{35}/, /sk-[A-Za-z0-9]{20}/, /Bearer\s+\S+/];
    suspiciousPatterns.forEach((pattern) => {
      expect(TRANSCRIPTION_PROMPT).not.toMatch(pattern);
    });
  });

  test('AUDIT_PROMPT não deve conter chaves de API ou tokens hardcoded', () => {
    const suspiciousPatterns = [/AIza[0-9A-Za-z-_]{35}/, /sk-[A-Za-z0-9]{20}/, /Bearer\s+\S+/];
    suspiciousPatterns.forEach((pattern) => {
      expect(AUDIT_PROMPT).not.toMatch(pattern);
    });
  });

  test('os prompts não devem ter URLs externas hardcoded (privacidade)', () => {
    const urlPattern = /https?:\/\/(?!aistudio\.google\.com)\S+/;
    expect(TRANSCRIPTION_PROMPT).not.toMatch(urlPattern);
    expect(AUDIT_PROMPT).not.toMatch(urlPattern);
  });
});
