/**
 * Fixture: laudo_hemograma.md
 * @description Simula a saída de transcrição fiel de um hemograma completo.
 *              Usado para testar o Smart Splitter com conteúdo realista.
 */

const LAUDO_HEMOGRAMA_MD = `## HEMOGRAMA COMPLETO

**Data de Coleta:** 20/06/2026
**Paciente:** [Dado omitido — LGPD]
**Médico Solicitante:** [Trecho Ilegível]

### Eritrograma

| Exame | Resultado | Valor de Referência | Unidade |
|---|---|---|---|
| Hemácias | 4,82 | 4,00 - 5,40 | milhões/mm³ |
| Hemoglobina | 14,2 | 12,0 - 16,0 | g/dL |
| Hematócrito | 43,1 | 36,0 - 47,0 | % |
| VCM | 89,4 | 80,0 - 100,0 | fL |
| HCM | 29,5 | 26,0 - 34,0 | pg |
| CHCM | 33,0 | 31,0 - 36,0 | g/dL |
| RDW | 13,2 | 11,5 - 14,5 | % |

### Leucograma

| Exame | Resultado | Valor de Referência | Unidade |
|---|---|---|---|
| Leucócitos | 6.500 | 4.000 - 11.000 | /mm³ |
| Neutrófilos Segmentados | 58 | 45 - 75 | % |
| Neutrófilos Bastonetes | 1 | 0 - 5 | % |
| Linfócitos | 31 | 20 - 45 | % |
| Monócitos | 7 | 2 - 10 | % |
| Eosinófilos | 3 | 1 - 5 | % |
| Basófilos | 0 | 0 - 2 | % |

### Plaquetas

| Exame | Resultado | Valor de Referência | Unidade |
|---|---|---|---|
| Plaquetas | 215.000 | 150.000 - 450.000 | /mm³ |

### Observações

Esfregaço sanguíneo: eritrócitos normocrômicos e normocíticos. Ausência de alterações morfológicas significativas.`;

/**
 * Fixture: artigo_cientifico_longo.md
 * @description Simula um trecho longo de artigo científico (>5000 chars) para
 *              testar o split em múltiplas partes.
 */
const ARTIGO_CIENTIFICO_LONGO_MD = 'A'.repeat(3000) + '\n\nSEÇÃO 2\n\n' + 'B'.repeat(3000) + '\n\nSEÇÃO 3\n\n' + 'C'.repeat(2000);

/**
 * Fixture: texto_curto.md
 * @description Texto curto que não deve ser dividido (menos de MAX_CHARS).
 */
const TEXTO_CURTO_MD = `## Relatório Breve\n\nResultado: Normal.\nData: 01/01/2026.`;

/**
 * Fixture: resultado_auditoria_aprovado
 * @description Mock de resposta da API de auditoria — caso sem divergências.
 */
const AUDIT_APROVADO = {
  status: 'APROVADO',
  confianca: 0.97,
  total_divergencias: 0,
  divergencias: [],
  observacoes: 'Transcrição fiel ao documento original. Nenhuma divergência detectada.',
};

/**
 * Fixture: resultado_auditoria_com_divergencias
 * @description Mock de resposta da API de auditoria — caso com divergências críticas.
 */
const AUDIT_COM_DIVERGENCIAS = {
  status: 'REQUER_REVISAO',
  confianca: 0.72,
  total_divergencias: 2,
  divergencias: [
    {
      tipo: 'numero_incorreto',
      descricao: 'Valor de Hemoglobina transcrito com erro decimal',
      original: '14,2',
      transcrito: '1,42',
    },
    {
      tipo: 'unidade_incorreta',
      descricao: 'Unidade de Hemoglobina incorreta',
      original: 'g/dL',
      transcrito: 'mg/dL',
    },
  ],
  observacoes: 'Duas divergências críticas encontradas. Revisão manual obrigatória antes do uso clínico.',
};

module.exports = {
  LAUDO_HEMOGRAMA_MD,
  ARTIGO_CIENTIFICO_LONGO_MD,
  TEXTO_CURTO_MD,
  AUDIT_APROVADO,
  AUDIT_COM_DIVERGENCIAS,
};
