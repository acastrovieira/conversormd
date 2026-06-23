import React, { useState, useEffect } from 'react';
import { Copy, Check, FileText, ChevronRight, ChevronLeft, Eye, Edit2 } from 'lucide-react';

export default function SplitViewer({ file, parts, onUpdatePartContent }) {
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleTextChange = (e) => {
    if (onUpdatePartContent) {
      onUpdatePartContent(activePartIndex, e.target.value);
    }
  };

  const fileExt = file?.name.split('.').pop().toLowerCase();
  const isPdf = fileExt === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(fileExt);
  
  const activePart = parts[activePartIndex];

  return (
    <div className="split-viewer-container animate-fade-in">
      {/* Coluna da Esquerda: Arquivo Original */}
      <div className="viewer-column left glass-panel">
        <div className="column-header">
          <div className="column-title">
            <Eye className="header-icon" />
            <h2>Documento Original</h2>
          </div>
          <span className="file-badge">{file?.name}</span>
        </div>
        
        <div className="document-preview-area">
          {isImage && fileUrl && (
            <div className="image-preview-wrapper">
              <img src={fileUrl} alt="Documento Original" className="preview-image" />
            </div>
          )}
          
          {isPdf && fileUrl && (
            <iframe 
              src={`${fileUrl}#toolbar=0`} 
              title="PDF Original" 
              className="preview-iframe"
            />
          )}

          {!isImage && !isPdf && (
            <div className="unsupported-preview">
              <FileText className="unsupported-icon" />
              <h3>Visualização Indisponível</h3>
              <p>O arquivo <strong>.{fileExt}</strong> não pode ser exibido diretamente no navegador.</p>
              <p className="hint">O processador de transcrição lerá o texto estruturado fielmente.</p>
            </div>
          )}
        </div>
      </div>

      {/* Coluna da Direita: Markdown Transcrito */}
      <div className="viewer-column right glass-panel">
        <div className="column-header">
          <div className="column-title">
            <FileText className="header-icon" />
            <h2>Markdown Gerado ({parts.length} parte{parts.length > 1 ? 's' : ''})</h2>
          </div>
          
          <div className="action-buttons-group">
            <button 
              className={`btn btn-secondary btn-icon-only ${editMode ? 'active' : ''}`}
              onClick={() => setEditMode(!editMode)}
              title={editMode ? "Modo Visualização" : "Modo Edição Manual"}
            >
              <Edit2 className="action-icon" />
              <span>{editMode ? 'Visualizar' : 'Editar'}</span>
            </button>
            <button 
              className="btn btn-secondary btn-icon-only"
              onClick={() => handleCopy(activePart?.content || '', activePartIndex)}
              disabled={!activePart?.content}
              title="Copiar Markdown"
            >
              {copiedIndex === activePartIndex ? <Check className="action-icon success" /> : <Copy className="action-icon" />}
              <span>{copiedIndex === activePartIndex ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Seletor de Abas para Múltiplas Partes (Smart Splitting) */}
        {parts.length > 1 && (
          <div className="tabs-container">
            <button 
              className="tab-nav-btn"
              onClick={() => setActivePartIndex(prev => Math.max(0, prev - 1))}
              disabled={activePartIndex === 0}
            >
              <ChevronLeft className="tab-nav-icon" />
            </button>
            
            <div className="tabs-scroll-area">
              {parts.map((part, idx) => (
                <button
                  key={idx}
                  className={`tab-btn ${idx === activePartIndex ? 'active' : ''}`}
                  onClick={() => setActivePartIndex(idx)}
                >
                  Parte {part.partNumber || idx + 1}
                  <span className="char-badge">{(part.charCount || part.content.length)} ch</span>
                </button>
              ))}
            </div>

            <button 
              className="tab-nav-btn"
              onClick={() => setActivePartIndex(prev => Math.min(parts.length - 1, prev + 1))}
              disabled={activePartIndex === parts.length - 1}
            >
              <ChevronRight className="tab-nav-icon" />
            </button>
          </div>
        )}

        <div className="markdown-content-area">
          {editMode ? (
            <textarea
              className="markdown-textarea"
              value={activePart?.content || ''}
              onChange={handleTextChange}
              placeholder="Edite o Markdown gerado aqui..."
            />
          ) : (
            <pre className="markdown-pre">
              <code>{activePart?.content || '*Nenhum conteúdo transcrito ainda.*'}</code>
            </pre>
          )}
        </div>

        <div className="column-footer">
          <span>Caracteres: <strong>{activePart?.content?.length || 0}</strong> / 5.000</span>
          <span>Nome de saída: <code>{activePart?.filename || `${file?.name.split('.')[0]}_parte${activePartIndex + 1}.md`}</code></span>
        </div>
      </div>

      <style>{`
        .split-viewer-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          width: 100%;
          margin-bottom: 24px;
        }
        .viewer-column {
          display: flex;
          flex-direction: column;
          height: 680px;
          overflow: hidden;
          background: var(--bg-secondary);
        }
        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          background: rgba(11, 15, 25, 0.3);
        }
        .column-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .header-icon {
          width: 20px;
          height: 20px;
          color: var(--primary);
        }
        .column-title h2 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .file-badge {
          font-size: 12px;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: 4px 8px;
          border-radius: var(--border-radius-sm);
          max-width: 200px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .action-buttons-group {
          display: flex;
          gap: 8px;
        }
        .btn-icon-only {
          padding: 6px 12px;
          font-size: 12px;
          height: 32px;
        }
        .btn-icon-only.active {
          background-color: var(--primary-bg-light);
          border-color: var(--primary);
          color: var(--primary-hover);
        }
        .action-icon {
          width: 14px;
          height: 14px;
        }
        .action-icon.success {
          color: var(--success);
        }
        
        /* Previews */
        .document-preview-area {
          flex-grow: 1;
          background: var(--bg-primary);
          overflow: auto;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .image-preview-wrapper {
          padding: 20px;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          overflow: auto;
        }
        .preview-image {
          max-width: 100%;
          height: auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          border-radius: 4px;
          border: 1px solid var(--border-color);
        }
        .preview-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        
        /* Unsupported screen */
        .unsupported-preview {
          text-align: center;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .unsupported-icon {
          width: 48px;
          height: 48px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .unsupported-preview h3 {
          font-size: 16px;
          color: var(--text-primary);
        }
        .unsupported-preview p {
          font-size: 13px;
          color: var(--text-secondary);
          max-width: 320px;
        }
        .unsupported-preview .hint {
          color: var(--text-muted);
          font-size: 12px;
        }
        
        /* Tabs Container */
        .tabs-container {
          display: flex;
          align-items: center;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-color);
          padding: 4px;
        }
        .tab-nav-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tab-nav-btn:hover:not(:disabled) {
          color: var(--text-primary);
        }
        .tab-nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .tab-nav-icon {
          width: 16px;
          height: 16px;
        }
        .tabs-scroll-area {
          display: flex;
          flex-grow: 1;
          overflow-x: auto;
          gap: 4px;
          scrollbar-width: none; /* Firefox */
        }
        .tabs-scroll-area::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }
        .tab-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all var(--transition-fast);
        }
        .tab-btn:hover {
          background: rgba(255,255,255,0.05);
        }
        .tab-btn.active {
          background: var(--bg-secondary);
          border-color: var(--border-color);
          color: var(--primary-hover);
        }
        .char-badge {
          font-size: 10px;
          background: var(--border-color);
          padding: 2px 6px;
          border-radius: 999px;
          color: var(--text-muted);
        }
        .tab-btn.active .char-badge {
          background: var(--primary-bg-light);
          color: var(--primary-hover);
        }
        
        /* Markdown Area */
        .markdown-content-area {
          flex-grow: 1;
          display: flex;
          background: #090c15;
          overflow: hidden;
        }
        .markdown-pre {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 20px;
          overflow: auto;
          font-family: var(--font-mono);
          font-size: 13.5px;
          line-height: 1.6;
          text-align: left;
          color: #e2e8f0;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .markdown-textarea {
          width: 100%;
          height: 100%;
          border: none;
          background: #060910;
          color: #e2e8f0;
          font-family: var(--font-mono);
          font-size: 13.5px;
          line-height: 1.6;
          padding: 20px;
          resize: none;
          outline: none;
        }
        .markdown-textarea:focus {
          background: #080c16;
        }
        
        /* Footer */
        .column-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 20px;
          border-top: 1px solid var(--border-color);
          background: rgba(11, 15, 25, 0.3);
          font-size: 11px;
          color: var(--text-muted);
        }
        .column-footer code {
          background: var(--bg-tertiary);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--text-secondary);
        }
        @media (max-width: 1024px) {
          .split-viewer-container {
            grid-template-columns: 1fr;
          }
          .viewer-column {
            height: 500px;
          }
        }
      `}</style>
    </div>
  );
}
