import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import SplitViewer from './components/SplitViewer';
import AuditPanel from './components/AuditPanel';
import DownloadButton from './components/DownloadButton';
import { RefreshCw, ShieldAlert, Cpu } from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [conversionData, setConversionData] = useState(null);

  // Estados BYOK & Multi-Modelos
  const [provider, setProvider] = useState(localStorage.getItem('conversor_md_provider') || 'gemini');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [claudeKey, setClaudeKey] = useState(localStorage.getItem('claude_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Estados temporários para edição dentro do modal
  const [tempProvider, setTempProvider] = useState(provider);
  const [tempGeminiKey, setTempGeminiKey] = useState(geminiKey);
  const [tempOpenaiKey, setTempOpenaiKey] = useState(openaiKey);
  const [tempClaudeKey, setTempClaudeKey] = useState(claudeKey);

  // Carrega o status do backend ao iniciar
  const fetchHealth = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth(null);
      }
    } catch (err) {
      console.error('Falha ao conectar com o backend:', err);
      setHealth(null);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // Executa o envio assíncrono para o backend
  const runUpload = async (selectedFile, currentProvider, currentKey) => {
    setIsProcessing(true);
    setError(null);
    setConversionData(null);

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/convert`, {
        method: 'POST',
        headers: {
          'x-llm-provider': currentProvider,
          'x-api-key': currentKey
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Erro do servidor (Código: ${response.status})`);
      }

      setConversionData(data);
    } catch (err) {
      console.error('Erro de conversão:', err);
      setError(err.message || 'Ocorreu um erro ao processar o arquivo.');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) {
      setFile(null);
      setConversionData(null);
      setError(null);
      return;
    }

    const activeKey = provider === 'openai' ? openaiKey : provider === 'claude' ? claudeKey : geminiKey;
    let hasServerKey = false;
    
    if (provider === 'openai') {
      hasServerKey = health?.openaiApiKey === 'configurada';
    } else if (provider === 'claude') {
      hasServerKey = health?.claudeApiKey === 'configurada';
    } else {
      hasServerKey = health?.geminiApiKey === 'configurada';
    }

    setFile(selectedFile);

    // Se não há chave de usuário nem do servidor, abre o modal de chaves
    if (!activeKey && !hasServerKey) {
      setTempProvider(provider);
      setTempGeminiKey(geminiKey);
      setTempOpenaiKey(openaiKey);
      setTempClaudeKey(claudeKey);
      setShowKeyModal(true);
      return;
    }

    await runUpload(selectedFile, provider, activeKey);
  };

  const handleUpdatePartContent = (index, newContent) => {
    if (!conversionData) return;
    
    const updatedParts = [...conversionData.parts];
    updatedParts[index] = {
      ...updatedParts[index],
      content: newContent,
      charCount: newContent.length
    };

    setConversionData({
      ...conversionData,
      parts: updatedParts
    });
  };

  const handleSaveKeys = () => {
    localStorage.setItem('conversor_md_provider', tempProvider);
    localStorage.setItem('gemini_api_key', tempGeminiKey.trim());
    localStorage.setItem('openai_api_key', tempOpenaiKey.trim());
    localStorage.setItem('claude_api_key', tempClaudeKey.trim());

    setProvider(tempProvider);
    setGeminiKey(tempGeminiKey.trim());
    setOpenaiKey(tempOpenaiKey.trim());
    setClaudeKey(tempClaudeKey.trim());

    setShowKeyModal(false);

    // Se houver um arquivo pré-selecionado, processa imediatamente com as novas chaves
    if (file) {
      const savedKey = tempProvider === 'openai' ? tempOpenaiKey.trim() : tempProvider === 'claude' ? tempClaudeKey.trim() : tempGeminiKey.trim();
      runUpload(file, tempProvider, savedKey);
    }
  };

  const resetConverter = () => {
    setFile(null);
    setConversionData(null);
    setError(null);
  };

  const activeKey = provider === 'openai' ? openaiKey : provider === 'claude' ? claudeKey : geminiKey;
  let hasServerKey = false;
  if (provider === 'openai') {
    hasServerKey = health?.openaiApiKey === 'configurada';
  } else if (provider === 'claude') {
    hasServerKey = health?.claudeApiKey === 'configurada';
  } else {
    hasServerKey = health?.geminiApiKey === 'configurada';
  }
  const isKeyPendente = !activeKey && !hasServerKey;

  return (
    <div className="app-layout">
      <Header 
        health={health} 
        apiKey={activeKey} 
        provider={provider}
        onOpenSettings={() => {
          setTempProvider(provider);
          setTempGeminiKey(geminiKey);
          setTempOpenaiKey(openaiKey);
          setTempClaudeKey(claudeKey);
          setShowKeyModal(true);
        }} 
      />

      <main className="main-content container animate-fade-in">
        {/* Aviso caso a chave da IA ativa não esteja configurada */}
        {health && isKeyPendente && (
          <div className="warning-banner glass-panel" style={{ borderLeftColor: 'var(--warning)' }}>
            <ShieldAlert className="warning-banner-icon" style={{ color: 'var(--warning)' }} />
            <div className="warning-text">
              <h3>Aviso: Chave de API do {provider.toUpperCase()} Pendente</h3>
              <p>A chave para o provedor selecionado (<code>{provider.toUpperCase()}</code>) não foi encontrada localmente nem no servidor. Clique em <strong>Configurar</strong> no cabeçalho acima para inseri-la e liberar o serviço.</p>
            </div>
          </div>
        )}

        {!conversionData ? (
          <div className="upload-view">
            <div className="welcome-section text-center">
              <h2>Transcrição Clínica de Alta Fidelidade</h2>
              <p>Envie laudos de exames, artigos ou livros médicos e obtenha uma transcrição estruturada em Markdown livre de interpretações, resumos ou alucinações.</p>
              <div className="active-llm-label" style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Provedor de inteligência ativo: <strong style={{ color: 'var(--primary-hover)', textTransform: 'uppercase' }}>{provider}</strong>
              </div>
            </div>
            <UploadZone 
              onFileSelect={handleFileSelect} 
              isProcessing={isProcessing} 
              error={error} 
            />
          </div>
        ) : (
          <div className="results-view">
            <div className="results-header-actions">
              <div className="results-title-group">
                <h2>Resultados do Processamento</h2>
                <p>Confira a transcrição e o laudo de dupla auditoria abaixo (Processado via {provider.toUpperCase()}).</p>
              </div>
              <button className="btn btn-secondary" onClick={resetConverter}>
                <RefreshCw className="btn-icon" />
                Processar Novo Arquivo
              </button>
            </div>

            {/* Painel de Auditoria (Double Check) */}
            <AuditPanel audit={conversionData.audit} />

            {/* Visualizador Lado a Lado */}
            <SplitViewer 
              file={file} 
              parts={conversionData.parts} 
              onUpdatePartContent={handleUpdatePartContent} 
            />

            {/* Botão de Download */}
            <DownloadButton 
              parts={conversionData.parts} 
              originalFileName={conversionData.originalFileName} 
              audit={conversionData.audit} 
            />
          </div>
        )}

        {/* Modal de Configurações de Chave / Provedor */}
        {showKeyModal && (
          <div className="modal-overlay">
            <div className="modal-content glass-panel animate-fade-in">
              <div className="modal-header">
                <ShieldAlert className="modal-icon animate-glow" style={{ color: 'var(--primary)' }} />
                <h2>Provedor & Chaves de API</h2>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p className="modal-intro">Escolha com qual modelo de inteligência artificial deseja processar seus laudos e configure sua chave correspondente. Suas chaves ficam guardadas apenas neste navegador.</p>
                
                <div className="provider-selector">
                  <span className="selector-title">LLM Ativa no Sistema:</span>
                  <div className="provider-options">
                    <button 
                      type="button"
                      className={`provider-option-btn ${tempProvider === 'gemini' ? 'active' : ''}`}
                      onClick={() => setTempProvider('gemini')}
                    >
                      Gemini (Google)
                    </button>
                    <button 
                      type="button"
                      className={`provider-option-btn ${tempProvider === 'openai' ? 'active' : ''}`}
                      onClick={() => setTempProvider('openai')}
                    >
                      GPT-4o (OpenAI)
                    </button>
                    <button 
                      type="button"
                      className={`provider-option-btn ${tempProvider === 'claude' ? 'active' : ''}`}
                      onClick={() => setTempProvider('claude')}
                    >
                      Claude (Anthropic)
                    </button>
                  </div>
                </div>

                <div className="key-inputs-section">
                  {/* Campo Gemini */}
                  <div className={`key-input-group ${tempProvider === 'gemini' ? 'highlight' : ''}`}>
                    <label>
                      Gemini API Key 
                      {health?.geminiApiKey === 'configurada' && <span className="server-badge">Servidor OK</span>}
                    </label>
                    <input 
                      type="password"
                      placeholder={health?.geminiApiKey === 'configurada' ? "Usando chave padrão do servidor (ou digite a sua)" : "Cole sua API Key do Gemini (AIzaSy...)"}
                      value={tempGeminiKey}
                      onChange={(e) => setTempGeminiKey(e.target.value)}
                    />
                    <span className="key-hint">Ideal para laudos em PDF nativos. Crie grátis no <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio ↗</a>.</span>
                  </div>

                  {/* Campo OpenAI */}
                  <div className={`key-input-group ${tempProvider === 'openai' ? 'highlight' : ''}`}>
                    <label>
                      OpenAI API Key
                      {health?.openaiApiKey === 'configurada' && <span className="server-badge">Servidor OK</span>}
                    </label>
                    <input 
                      type="password"
                      placeholder={health?.openaiApiKey === 'configurada' ? "Usando chave padrão do servidor (ou digite a sua)" : "Cole sua API Key da OpenAI (sk-...)"}
                      value={tempOpenaiKey}
                      onChange={(e) => setTempOpenaiKey(e.target.value)}
                    />
                    <span className="key-hint">Ideal para imagens e laudos curtos. Obtenha em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform ↗</a>.</span>
                  </div>

                  {/* Campo Claude */}
                  <div className={`key-input-group ${tempProvider === 'claude' ? 'highlight' : ''}`}>
                    <label>
                      Anthropic Claude API Key
                      {health?.claudeApiKey === 'configurada' && <span className="server-badge">Servidor OK</span>}
                    </label>
                    <input 
                      type="password"
                      placeholder={health?.claudeApiKey === 'configurada' ? "Usando chave padrão do servidor (ou digite a sua)" : "Cole sua API Key do Claude (sk-ant-...)"}
                      value={tempClaudeKey}
                      onChange={(e) => setTempClaudeKey(e.target.value)}
                    />
                    <span className="key-hint">Excelente qualidade em tabelas e estruturas. Obtenha em <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">Anthropic Console ↗</a>.</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowKeyModal(false);
                    // Se nenhuma chave estiver ativa, cancela seleção de arquivo
                    const activeSavedKey = provider === 'openai' ? openaiKey : provider === 'claude' ? claudeKey : geminiKey;
                    const hasSavedServerKey = provider === 'openai' ? health?.openaiApiKey === 'configurada' : provider === 'claude' ? health?.claudeApiKey === 'configurada' : health?.geminiApiKey === 'configurada';
                    if (!activeSavedKey && !hasSavedServerKey) {
                      setFile(null);
                    }
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  className="btn btn-primary" 
                  onClick={handleSaveKeys}
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="container footer-content">
          <div className="security-note">
            <Cpu className="footer-icon" />
            <span>Processamento local em conformidade com a LGPD e HIPAA. Nenhum documento é retido no servidor local após o encerramento do processo.</span>
          </div>
          <span className="footer-version">v1.0.0 — Local First</span>
        </div>
      </footer>

      <style>{`
        .app-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .main-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 48px;
        }
        .warning-banner {
          display: flex;
          gap: 16px;
          padding: 16px 20px;
          border-left: 4px solid var(--warning);
          background: var(--warning-bg-light);
          align-items: flex-start;
          text-align: left;
          margin-bottom: 8px;
        }
        .warning-banner-icon {
          width: 24px;
          height: 24px;
          color: var(--warning);
          flex-shrink: 0;
        }
        .warning-text h3 {
          font-size: 15px;
          font-weight: 700;
          color: #fbbf24;
          margin-bottom: 4px;
        }
        .warning-text p {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .warning-text code {
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--text-primary);
        }
        
        .welcome-section {
          max-width: 700px;
          margin: 40px auto 32px;
          text-align: center;
        }
        .welcome-section h2 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .welcome-section p {
          font-size: 15px;
          line-height: 1.6;
          color: var(--text-secondary);
        }
        
        .results-header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .results-title-group {
          text-align: left;
        }
        .results-title-group h2 {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .results-title-group p {
          font-size: 13.5px;
          color: var(--text-muted);
        }
        
        .app-footer {
          border-top: 1px solid var(--border-color);
          background: var(--bg-secondary);
          padding: 20px 0;
          margin-top: auto;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .security-note {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--text-muted);
          text-align: left;
          max-width: 800px;
        }
        .footer-icon {
          width: 16px;
          height: 16px;
          color: var(--success);
          flex-shrink: 0;
        }
        .footer-version {
          font-size: 12px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        
        
        /* Modal - Provedor & Chaves de API */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(7, 10, 19, 0.85);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .modal-content {
          width: 100%;
          max-width: 580px;
          border-radius: var(--border-radius-lg);
          padding: 32px;
          background: var(--bg-glass);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg), var(--shadow-glow);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }
        .modal-icon {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
        }
        .modal-header h2 {
          font-size: 22px;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .modal-intro {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .provider-selector {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: var(--bg-tertiary);
          padding: 16px;
          border-radius: var(--border-radius-md);
          border: 1px solid var(--border-color);
        }
        .selector-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
        }
        .provider-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 4px;
        }
        .provider-option-btn {
          padding: 10px 8px;
          font-size: 12.5px;
          font-weight: 600;
          font-family: var(--font-sans);
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          outline: none;
        }
        .provider-option-btn:hover {
          border-color: var(--border-color-hover);
          color: var(--text-primary);
        }
        .provider-option-btn.active {
          background: var(--primary-bg-light);
          border-color: var(--primary);
          color: var(--primary-hover);
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.25);
        }
        .key-inputs-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .key-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 14px;
          border-radius: var(--border-radius-md);
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.015);
          transition: all var(--transition-normal);
        }
        .key-input-group.highlight {
          border-color: rgba(139, 92, 246, 0.25);
          background: rgba(139, 92, 246, 0.04);
        }
        .key-input-group label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .server-badge {
          font-size: 9px;
          padding: 2px 6px;
          background: var(--success-bg-light);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 4px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .key-input-group input {
          padding: 10px 14px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          color: var(--text-primary);
          font-family: var(--font-mono);
          font-size: 12.5px;
          transition: all var(--transition-fast);
        }
        .key-input-group input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.25);
          outline: none;
        }
        .key-hint {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .key-hint a {
          color: var(--primary-hover);
          text-decoration: none;
        }
        .key-hint a:hover {
          text-decoration: underline;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
        }

        @media (max-width: 640px) {
          .footer-content {
            flex-direction: column;
            align-items: flex-start;
          }
          .results-header-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .results-header-actions button {
            width: 100%;
          }
          .provider-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
