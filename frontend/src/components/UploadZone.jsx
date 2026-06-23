import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';

export default function UploadZone({ onFileSelect, isProcessing, error }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [statusMessage, setStatusMessage] = useState('Preparando o envio do documento...');

  useEffect(() => {
    if (!isProcessing) {
      setStatusMessage('Preparando o envio do documento...');
      return;
    }

    const messages = [
      'Enviando o arquivo para o servidor local...',
      'Fase 1: Analisando o documento e iniciando a transcrição...',
      'Fase 1: Transcrevendo conteúdo médico (isso pode demorar de 20s a 60s)...',
      'Fase 1: Estruturando tabelas e limpando carimbos/assinaturas...',
      'Fase 2: Iniciando a auditoria de dupla checagem contra alucinações...',
      'Fase 2: Verificando possíveis divergências em valores numéricos...',
      'Fase 2: Comparando unidades de medida e dados clínicos...',
      'Fase 2: Finalizando o laudo de segurança e conformidade...',
      'Processando as partes finais... Quase pronto!'
    ];

    let currentIdx = 0;
    setStatusMessage(messages[0]);

    const interval = setInterval(() => {
      currentIdx = (currentIdx + 1) % messages.length;
      setStatusMessage(messages[currentIdx]);
    }, 7000); // Muda a mensagem a cada 7 segundos

    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSelect(file);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const validateAndSelect = (file) => {
    if (isProcessing) return;
    
    // Validar extensões aceitas: pdf, png, jpg, jpeg, webp, docx
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'docx'];
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      alert("Tipo de arquivo não suportado. Por favor, envie PDF, Imagens (PNG, JPG, WEBP) ou DOCX.");
      return;
    }
    
    setSelectedFile(file);
    onFileSelect(file);
  };

  const triggerInput = () => {
    if (isProcessing) return;
    fileInputRef.current.click();
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    return <FileText className={`file-icon-type ${ext}`} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-zone-wrapper animate-fade-in">
      <div 
        className={`upload-zone glass-panel ${isDragActive ? 'drag-active' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInput}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="file-input-hidden"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
          onChange={handleChange}
          disabled={isProcessing}
        />

        {!selectedFile && !isProcessing && (
          <div className="upload-prompt">
            <div className="icon-glow-wrapper">
              <UploadCloud className="upload-icon" />
            </div>
            <h3>Arraste seu arquivo ou clique para buscar</h3>
            <p className="file-types-hint">Suporta laudos e imagens em PDF, PNG, JPG, WEBP e DOCX (máx. 50MB)</p>
          </div>
        )}

        {selectedFile && !isProcessing && (
          <div className="selected-file-display" onClick={(e) => e.stopPropagation()}>
            <div className="file-info-card glass-panel">
              {getFileIcon(selectedFile.name)}
              <div className="file-details">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">{formatFileSize(selectedFile.size)}</span>
              </div>
              <button className="clear-btn" onClick={clearSelection} title="Remover arquivo">
                <X className="clear-icon" />
              </button>
            </div>
            <button className="btn btn-primary start-process-btn" onClick={() => onFileSelect(selectedFile)}>
              Processar Documento
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="processing-display" onClick={(e) => e.stopPropagation()}>
            <div className="spinner-wrapper">
              <div className="loading-spinner" />
              <div className="pulse-circle" />
            </div>
            <h3>{statusMessage}</h3>
            <p className="processing-subtext">Esta etapa realiza a transcrição literal e a dupla auditoria (Fase 1 & 2). Arquivos extensos podem levar de 30 a 120 segundos.</p>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error-banner glass-panel">
          <AlertCircle className="error-icon" />
          <div className="error-message-group">
            <span className="error-title">Erro no Processamento</span>
            <span className="error-desc">{error}</span>
          </div>
        </div>
      )}

      <style>{`
        .upload-zone-wrapper {
          width: 100%;
          margin-bottom: 24px;
        }
        .upload-zone {
          border: 2px dashed var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 40px 24px;
          text-align: center;
          cursor: pointer;
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: rgba(19, 26, 44, 0.4);
          overflow: hidden;
        }
        .upload-zone:hover {
          border-color: var(--primary);
          background: rgba(139, 92, 246, 0.03);
        }
        .upload-zone.drag-active {
          border-color: var(--primary);
          background: rgba(139, 92, 246, 0.08);
          transform: scale(0.995);
        }
        .upload-zone.processing {
          cursor: default;
          border-color: var(--info);
          background: rgba(6, 182, 212, 0.02);
        }
        .file-input-hidden {
          display: none;
        }
        .icon-glow-wrapper {
          width: 64px;
          height: 64px;
          background: var(--bg-tertiary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          border: 1px solid var(--border-color);
          transition: all var(--transition-fast);
        }
        .upload-zone:hover .icon-glow-wrapper {
          border-color: var(--primary);
          color: var(--primary);
          box-shadow: 0 0 16px rgba(139, 92, 246, 0.2);
        }
        .upload-icon {
          width: 28px;
          height: 28px;
          color: var(--text-secondary);
          transition: color var(--transition-fast);
        }
        .upload-zone:hover .upload-icon {
          color: var(--primary-hover);
        }
        .upload-prompt h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--text-primary);
        }
        .file-types-hint {
          font-size: 13px;
          color: var(--text-muted);
        }
        
        /* Selected File Card */
        .selected-file-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
          max-width: 480px;
        }
        .file-info-card {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 14px 18px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          text-align: left;
        }
        .file-icon-type {
          width: 32px;
          height: 32px;
          color: var(--primary);
        }
        .file-icon-type.pdf {
          color: #f43f5e;
        }
        .file-icon-type.docx {
          color: #3b82f6;
        }
        .file-details {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          overflow: hidden;
        }
        .file-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .file-size {
          font-size: 12px;
          color: var(--text-muted);
        }
        .clear-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .clear-btn:hover {
          color: var(--danger);
          background: rgba(239, 68, 68, 0.1);
        }
        .clear-icon {
          width: 18px;
          height: 18px;
        }
        .start-process-btn {
          width: 100%;
          font-size: 15px;
          font-weight: 600;
          padding: 12px 24px;
        }

        /* Processing Display */
        .processing-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 500px;
        }
        .spinner-wrapper {
          position: relative;
          width: 60px;
          height: 60px;
          margin-bottom: 20px;
        }
        .loading-spinner {
          width: 100%;
          height: 100%;
          border: 4px solid var(--border-color);
          border-top-color: var(--info);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .pulse-circle {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border: 1px solid var(--info);
          border-radius: 50%;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          opacity: 0.5;
        }
        .processing-display h3 {
          font-size: 18px;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        .processing-subtext {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }
        .progress-bar-container {
          width: 100%;
          height: 6px;
          background: var(--border-color);
          border-radius: var(--border-radius-sm);
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          width: 30%;
          background: linear-gradient(90deg, var(--info) 0%, var(--primary) 100%);
          border-radius: var(--border-radius-sm);
          animation: progressAnimation 2.5s infinite ease-in-out;
        }

        /* Error Banner */
        .upload-error-banner {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px;
          background: var(--danger-bg-light);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: var(--border-radius-md);
          margin-top: 16px;
          text-align: left;
          animation: fadeIn var(--transition-fast);
        }
        .error-icon {
          width: 20px;
          height: 20px;
          color: var(--danger);
          flex-shrink: 0;
        }
        .error-message-group {
          display: flex;
          flex-direction: column;
        }
        .error-title {
          font-size: 14px;
          font-weight: 700;
          color: #fca5a5;
          margin-bottom: 2px;
        }
        .error-desc {
          font-size: 13px;
          color: var(--text-secondary);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        @keyframes progressAnimation {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
