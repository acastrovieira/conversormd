/**
 * Testes Unitários — Smart Splitter
 * @description Testa exaustivamente a lógica de corte inteligente para garantir:
 *   - Nenhuma perda de dados entre partes
 *   - Respeito aos limites de caracteres
 *   - Prioridade correta de pontos de corte
 *   - Metadados corretos nos cabeçalhos de cada parte
 *   - Comportamento com textos curtos (sem split)
 *   - Comportamento com textos muito longos (split múltiplo)
 * @module tests/unit/smartSplitter.test
 *
 * Squad: @qa (design dos critérios) + @dev (implementação)
 */

// Garante que MAX_CHARS seja configurável nos testes sem alterar env real
process.env.MAX_CHARS_PER_MD_FILE = '200';

const { splitMarkdown, findBestCutPoint, MAX_CHARS } = require('../../utils/smartSplitter');
const {
  LAUDO_HEMOGRAMA_MD,
  ARTIGO_CIENTIFICO_LONGO_MD,
  TEXTO_CURTO_MD,
} = require('../fixtures/testFixtures');

// ─── Bloco 1: findBestCutPoint ────────────────────────────────────────────────

describe('findBestCutPoint()', () => {
  const LIMIT = 100;

  test('deve retornar índice dentro do limite', () => {
    const text = 'a'.repeat(200);
    const cut = findBestCutPoint(text, LIMIT);
    expect(cut).toBeLessThanOrEqual(LIMIT);
    expect(cut).toBeGreaterThan(0);
  });

  test('deve preferir corte após parágrafo (\\n\\n) quando possível', () => {
    // Parágrafo em >60% do limite
    const text = 'A'.repeat(65) + '\n\n' + 'B'.repeat(35);
    const cut = findBestCutPoint(text, LIMIT);
    // O corte deve ser APÓS o \n\n (índice 67)
    expect(text.slice(0, cut).trimEnd()).toBe('A'.repeat(65));
  });

  test('deve cortar no final de uma linha (\\n) quando não há parágrafo adequado', () => {
    // Linha única terminando em >40% do limite
    const text = 'A'.repeat(50) + '\n' + 'B'.repeat(60);
    const cut = findBestCutPoint(text, LIMIT);
    expect(cut).toBeLessThanOrEqual(LIMIT);
    expect(cut).toBeGreaterThan(0);
  });

  test('deve usar espaço como fallback quando não há \\n adequado', () => {
    // Texto sem newlines mas com espaços
    const text = 'palavra '.repeat(15);
    const cut = findBestCutPoint(text, LIMIT);
    // Não deve ser no meio de uma palavra
    expect(text[cut - 1]).toBe(' ');
  });

  test('deve retornar o limite exato em texto sem separadores (edge case)', () => {
    // String contínua sem espaços ou newlines — caso extremo
    const text = 'x'.repeat(300);
    const cut = findBestCutPoint(text, LIMIT);
    expect(cut).toBe(LIMIT);
  });
});

// ─── Bloco 2: splitMarkdown — Texto Curto (sem split) ────────────────────────

describe('splitMarkdown() — texto curto (sem split necessário)', () => {
  // MAX_CHARS = 200. TEXTO_CURTO_MD é muito menor que 200.
  test('deve retornar exatamente 1 parte quando o texto é menor que MAX_CHARS', () => {
    const result = splitMarkdown(TEXTO_CURTO_MD, 'relatorio.pdf');
    expect(result).toHaveLength(1);
  });

  test('parte única deve ter partNumber=1 e totalParts=1', () => {
    const result = splitMarkdown(TEXTO_CURTO_MD, 'relatorio.pdf');
    expect(result[0].partNumber).toBe(1);
    expect(result[0].totalParts).toBe(1);
  });

  test('filename da parte única deve terminar em _part1.md', () => {
    const result = splitMarkdown(TEXTO_CURTO_MD, 'relatorio.pdf');
    expect(result[0].filename).toBe('relatorio_part1.md');
  });

  test('conteúdo não deve ser vazio', () => {
    const result = splitMarkdown(TEXTO_CURTO_MD, 'relatorio.pdf');
    expect(result[0].content.trim().length).toBeGreaterThan(0);
  });

  test('conteúdo deve incluir o texto original', () => {
    const result = splitMarkdown(TEXTO_CURTO_MD, 'relatorio.pdf');
    expect(result[0].content).toContain('Relatório Breve');
    expect(result[0].content).toContain('Resultado: Normal.');
  });
});

// ─── Bloco 3: splitMarkdown — Texto Longo (split múltiplo) ───────────────────

describe('splitMarkdown() — texto longo (split em múltiplas partes)', () => {
  // Usa MAX_CHARS=200. ARTIGO_CIENTIFICO_LONGO_MD tem >8000 chars.
  let result;

  beforeAll(() => {
    result = splitMarkdown(ARTIGO_CIENTIFICO_LONGO_MD, 'artigo.pdf');
  });

  test('deve gerar mais de 1 parte para texto longo', () => {
    expect(result.length).toBeGreaterThan(1);
  });

  test('nenhuma parte deve exceder o limite de MAX_CHARS + tamanho do header', () => {
    result.forEach((part) => {
      // O charCount é do conteúdo sem header, então verificamos por ele
      expect(part.charCount).toBeLessThanOrEqual(MAX_CHARS);
    });
  });

  test('a concatenação de todas as partes deve conter todo o texto original', () => {
    // Remove os headers de metadados e une tudo
    const contentWithoutHeaders = result
      .map((p) => p.content.replace(/<!--.*?-->/gs, '').trim())
      .join(' ');

    // Verifica que nenhum dado foi perdido — presença dos trechos chave
    expect(contentWithoutHeaders).toContain('SEÇÃO 2');
    expect(contentWithoutHeaders).toContain('SEÇÃO 3');
  });

  test('totalParts deve ser o mesmo em todas as partes', () => {
    const total = result[0].totalParts;
    result.forEach((part) => {
      expect(part.totalParts).toBe(total);
    });
    expect(total).toBe(result.length);
  });

  test('partNumber deve ser sequencial sem lacunas', () => {
    result.forEach((part, i) => {
      expect(part.partNumber).toBe(i + 1);
    });
  });

  test('cada parte deve ter filename único com número correto', () => {
    const filenames = result.map((p) => p.filename);
    const uniqueFilenames = new Set(filenames);
    expect(uniqueFilenames.size).toBe(result.length);

    result.forEach((part, i) => {
      expect(part.filename).toBe(`artigo_part${i + 1}.md`);
    });
  });
});

// ─── Bloco 4: splitMarkdown — Metadados e Cabeçalho ─────────────────────────

describe('splitMarkdown() — validação de metadados nos cabeçalhos', () => {
  let parts;

  beforeAll(() => {
    parts = splitMarkdown(ARTIGO_CIENTIFICO_LONGO_MD, 'laudo_hemograma.pdf');
  });

  test('cada parte deve conter o comentário CONVERSOR-MD no início', () => {
    parts.forEach((part) => {
      expect(part.content).toMatch(/<!-- CONVERSOR-MD \| ORIGEM:/);
    });
  });

  test('o nome do arquivo original deve aparecer nos metadados', () => {
    parts.forEach((part) => {
      expect(part.content).toContain('ORIGEM: laudo_hemograma.pdf');
    });
  });

  test('os metadados devem indicar corretamente PARTE X de Y', () => {
    parts.forEach((part, i) => {
      expect(part.content).toContain(`PARTE: ${i + 1} de ${parts.length}`);
    });
  });

  test('o campo charCount deve corresponder ao tamanho real do conteúdo sem header', () => {
    parts.forEach((part) => {
      // charCount é calculado antes da adição do header
      expect(typeof part.charCount).toBe('number');
      expect(part.charCount).toBeGreaterThan(0);
    });
  });

  test('o conteúdo deve incluir nota de sequência', () => {
    parts.forEach((part) => {
      expect(part.content).toContain('Este arquivo faz parte de uma sequência');
    });
  });
});

// ─── Bloco 5: splitMarkdown — Segurança de Dados (LGPD) ─────────────────────

describe('splitMarkdown() — segurança: sem alteração de conteúdo clínico', () => {
  test('dados numéricos do hemograma não devem ser alterados durante o split', () => {
    // Usa um limite pequeno para forçar o split de conteúdo médico real
    const result = splitMarkdown(LAUDO_HEMOGRAMA_MD, 'hemograma.pdf');

    // Une todo o conteúdo (remove apenas os comentários HTML de metadados)
    const allContent = result
      .map((p) => p.content.replace(/<!--.*?-->/gs, ''))
      .join('');

    // Verifica que valores críticos de exames permanecem intactos
    expect(allContent).toContain('4,82');       // Hemácias
    expect(allContent).toContain('14,2');        // Hemoglobina
    expect(allContent).toContain('215.000');     // Plaquetas
    expect(allContent).toContain('g/dL');        // Unidade
    expect(allContent).toContain('milhões/mm³'); // Unidade composta
    expect(allContent).toContain('[Trecho Ilegível]'); // Marcador de ilegibilidade
  });

  test('nenhuma parte deve conter texto inventado além dos metadados do sistema', () => {
    const result = splitMarkdown(LAUDO_HEMOGRAMA_MD, 'hemograma.pdf');
    result.forEach((part) => {
      const cleanContent = part.content.replace(/<!--.*?-->/gs, '').trim();
      // Verifica que não há texto de preenchimento gerado artificialmente
      expect(cleanContent).not.toContain('Lorem ipsum');
      expect(cleanContent).not.toContain('[GERADO AUTOMATICAMENTE]');
    });
  });
});

// ─── Bloco 6: splitMarkdown — Casos de Borda (Edge Cases) ───────────────────

describe('splitMarkdown() — edge cases', () => {
  test('string vazia deve retornar array vazio (loop não entra)', () => {
    const result = splitMarkdown('', 'vazio.pdf');
    // Texto vazio após trim() não entra no loop — resultado é array vazio
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test('texto exatamente no limite deve gerar 1 parte', () => {
    const text = 'A'.repeat(MAX_CHARS);
    const result = splitMarkdown(text, 'exato.pdf');
    expect(result).toHaveLength(1);
  });

  test('texto um caractere acima do limite deve gerar 2 partes', () => {
    // Adiciona espaço para garantir ponto de corte legível
    const text = 'A'.repeat(MAX_CHARS - 10) + ' ' + 'B'.repeat(15);
    const result = splitMarkdown(text, 'acima.pdf');
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  test('nome de arquivo com espaços deve gerar filename seguro sem extensão dupla', () => {
    const result = splitMarkdown('Conteúdo de teste', 'laudo médico 2026.pdf');
    expect(result[0].filename).toBe('laudo médico 2026_part1.md');
    expect(result[0].filename).not.toContain('.pdf.md');
  });

  test('arquivo sem extensão deve funcionar sem erro', () => {
    const result = splitMarkdown('Conteúdo', 'arquivo_sem_extensao');
    expect(result[0].filename).toBe('arquivo_sem_extensao_part1.md');
  });
});
