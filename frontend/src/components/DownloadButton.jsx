import React, { useState } from 'react';
import { Download, FileArchive, FileText, CheckCircle } from 'lucide-react';
import JSZip from 'jszip';

export default function DownloadButton({ parts, originalFileName, audit }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const baseName = originalFileName ? originalFileName.split('.').slice(0, -1).join('.') : 'documento';

  const downloadSingleFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerSuccessState();
  };

  const downloadAllAsZip = async () => {
    if (parts.length === 0) return;
    setIsGenerating(true);

    try {
      const zip = new JSZip();

      // Adiciona cada parte markdown ao zip
      parts.forEach((part, index) => {
        const name = part.filename || `${baseName}_parte${index + 1}.md`;
        zip.file(name, part.content);
      });

      // Adiciona relatório de auditoria estruturado se existir
      if (audit) {
        const auditText = `==================================================
RELATÓRIO DE AUDITORIA DE DUPLA CHECAGEM (LGPD / HIPAA)
==================================================
Documento Original: ${originalFileName}
Data de Processamento: ${new Date().toLocaleString()}
Status da Auditoria: ${audit.status}
Nível de Confiança: ${audit.confianca}
Total de Divergências: ${audit.total_divergencias}

--------------------------------------------------
PARECER GERAL:
--------------------------------------------------
${audit.observacoes || 'Nenhuma observação informada.'}

--------------------------------------------------
DIVERGÊNCIAS DETALHADAS:
--------------------------------------------------
${audit.divergencias && audit.divergencias.length > 0 
  ? audit.divergencias.map((div, i) => `${i + 1}. [${div.tipo.toUpperCase()}] (Gravidade: ${div.gravidade})
   Localização: ${div.localizacao || 'Não especificada'}
   Texto Original: "${div.original || ''}"
   Texto Markdown: "${div.gerado || ''}"
--------------------------------------------------`).join('\n')
  : 'Nenhuma divergência ou alucinação identificada.'}
`;
        zip.file(`auditoria_seguranca_${baseName}.txt`, auditText);
      }

      // Gera o blob do ZIP
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseName}_markdowns.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerSuccessState();
    } catch (err) {
      console.error('Erro ao gerar arquivo ZIP:', err);
      alert('Ocorreu um erro ao gerar o arquivo compactado.');
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerSuccessState = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  if (parts.length === 0) return null;

  return (
    <div className="download-actions-card glass-panel animate-fade-in">
      <div className="download-info">
        <h3>Exportação dos Resultados</h3>
        <p>Os arquivos markdown gerados e o relatório de dupla checagem estão prontos para exportação local.</p>
      </div>

      <div className="download-buttons-wrapper">
        {parts.length === 1 ? (
          <button 
            className={`btn ${downloadSuccess ? 'btn-success' : 'btn-primary'} download-btn`}
            onClick={() => downloadSingleFile(parts[0].content, parts[0].filename || `${baseName}.md`)}
            disabled={downloadSuccess}
          >
            {downloadSuccess ? (
              <>
                <CheckCircle className="btn-icon" />
                Download Concluído!
              </>
            ) : (
              <>
                <Download className="btn-icon" />
                Baixar Markdown (.md)
              </>
            )}
          </button>
        ) : (
          <>
            <button 
              className={`btn ${downloadSuccess ? 'btn-success' : 'btn-primary'} download-btn`}
              onClick={downloadAllAsZip}
              disabled={isGenerating || downloadSuccess}
            >
              {isGenerating ? (
                <>
                  <div className="spinner-mini" />
                  Gerando ZIP...
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle className="btn-icon" />
                  ZIP Baixado!
                </>
              ) : (
                <>
                  <FileArchive className="btn-icon" />
                  Baixar Todas as Partes (ZIP)
                </>
              )}
            </button>

            <div className="download-individual-dropdown">
              <span className="dropdown-label">Ou baixe individualmente:</span>
              <div className="individual-links">
                {parts.map((part, idx) => (
                  <button
                    key={idx}
                    className="individual-download-item"
                    onClick={() => downloadSingleFile(part.content, part.filename || `${baseName}_parte${idx + 1}.md`)}
                  >
                    <FileText className="item-icon" />
                    <span>Parte {part.partNumber || idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .download-actions-card {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(6, 182, 212, 0.04) 100%);
          border-color: rgba(139, 92, 246, 0.25);
          margin-bottom: 32px;
        }
        .download-info {
          flex-grow: 1;
          text-align: left;
          max-width: 600px;
        }
        .download-info h3 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .download-info p {
          font-size: 13.5px;
          color: var(--text-secondary);
        }
        .download-buttons-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .download-btn {
          font-weight: 600;
          padding: 12px 24px;
          font-size: 14.5px;
          min-width: 230px;
          height: 46px;
        }
        .btn-icon {
          width: 18px;
          height: 18px;
        }
        .spinner-mini {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        .download-individual-dropdown {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }
        .dropdown-label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .individual-links {
          display: flex;
          gap: 8px;
          max-width: 320px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .individual-download-item {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 12px;
          padding: 6px 12px;
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .individual-download-item:hover {
          color: var(--primary-hover);
          border-color: var(--primary-hover);
          background: rgba(139, 92, 246, 0.05);
        }
        .item-icon {
          width: 12px;
          height: 12px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .download-actions-card {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }
          .download-info {
            text-align: center;
          }
          .download-buttons-wrapper {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
