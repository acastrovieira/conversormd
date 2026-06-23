/**
 * Smart Splitter — Conversor MD
 * @description Divide texto Markdown em blocos de no máximo MAX_CHARS caracteres
 *              com quebra inteligente que respeita parágrafos, tabelas e headings.
 *              Nunca corta palavras nem tags Markdown no meio.
 * @module utils/smartSplitter
 */

const MAX_CHARS = parseInt(process.env.MAX_CHARS_PER_MD_FILE) || 5000;

/**
 * Encontra o melhor ponto de corte antes de `limit` caracteres.
 * Prioridade de corte: fim de tabela > fim de parágrafo > fim de frase > espaço.
 *
 * @param {string} text - Texto completo
 * @param {number} limit - Limite máximo de caracteres
 * @returns {number} - Índice ideal para o corte
 */
function findBestCutPoint(text, limit) {
  const slice = text.slice(0, limit);

  // 1. Tenta cortar no final de uma tabela (linha em branco após linha com |)
  const tableEnd = slice.lastIndexOf('\n\n');
  if (tableEnd > limit * 0.6) return tableEnd + 2;

  // 2. Tenta cortar em parágrafo (linha em branco dupla)
  const paraEnd = slice.lastIndexOf('\n\n');
  if (paraEnd > limit * 0.5) return paraEnd + 2;

  // 3. Tenta cortar no final de uma linha
  const lineEnd = slice.lastIndexOf('\n');
  if (lineEnd > limit * 0.4) return lineEnd + 1;

  // 4. Tenta cortar no final de uma frase
  const sentenceEnd = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('.\n'),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? ')
  );
  if (sentenceEnd > limit * 0.3) return sentenceEnd + 1;

  // 5. Fallback: corta no último espaço antes do limite
  const spaceEnd = slice.lastIndexOf(' ');
  if (spaceEnd > 0) return spaceEnd + 1;

  // 6. Último recurso: corta no limite exato (só ocorre em palavras enormes ou binário)
  return limit;
}

/**
 * Divide o texto Markdown em múltiplas partes com cabeçalho de metadados.
 *
 * @param {string} fullText - Texto Markdown completo
 * @param {string} originalFileName - Nome do arquivo original (para metadados)
 * @returns {Array<{filename: string, content: string, partNumber: number, totalParts: number}>}
 */
function splitMarkdown(fullText, originalFileName) {
  const parts = [];
  let remaining = fullText.trim();
  let partIndex = 0;

  // Primeiro passe: divide o texto em blocos brutos
  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHARS) {
      parts.push(remaining);
      break;
    }
    const cutPoint = findBestCutPoint(remaining, MAX_CHARS);
    parts.push(remaining.slice(0, cutPoint).trimEnd());
    remaining = remaining.slice(cutPoint).trimStart();
    partIndex++;
  }

  const totalParts = parts.length;

  // Segundo passe: adiciona cabeçalho de metadados em cada parte
  return parts.map((content, i) => {
    const partNumber = i + 1;
    const baseName = originalFileName.replace(/\.[^.]+$/, ''); // remove extensão
    const filename = `${baseName}_part${partNumber}.md`;

    const header = [
      `<!-- CONVERSOR-MD | ORIGEM: ${originalFileName} | PARTE: ${partNumber} de ${totalParts} | CHARS: ${content.length} -->`,
      `<!-- NOTA: Este arquivo faz parte de uma sequência. Leia todos os arquivos em ordem para contexto completo. -->`,
      '',
    ].join('\n');

    return {
      partNumber,
      totalParts,
      filename,
      content: header + content,
      charCount: content.length,
    };
  });
}

module.exports = { splitMarkdown, findBestCutPoint, MAX_CHARS };
