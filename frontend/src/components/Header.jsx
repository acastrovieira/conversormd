import React from 'react';
import { Shield, Cpu, Key } from 'lucide-react';

export default function Header({ health, apiKey, provider = 'gemini', onOpenSettings }) {
  const hasUserKey = !!apiKey;
  
  let isServerConfigured = false;
  if (provider === 'openai') {
    isServerConfigured = health?.openaiApiKey === 'configurada';
  } else if (provider === 'claude') {
    isServerConfigured = health?.claudeApiKey === 'configurada';
  } else {
    isServerConfigured = health?.geminiApiKey === 'configurada';
  }
  
  const isActive = hasUserKey || isServerConfigured;
  const providerLabel = provider === 'openai' ? 'OpenAI' : provider === 'claude' ? 'Claude' : 'Gemini';

  return (
    <header className="header animate-fade-in">
      <div className="header-container">
        <div className="logo-group">
          <div className="logo-icon-wrapper">
            <Shield className="logo-icon animate-glow" />
          </div>
          <div>
            <h1>Conversor MD</h1>
            <p className="subtitle">Fidelidade Médica Absoluta & LGPD</p>
          </div>
        </div>

        <div className="health-status-badge glass-panel">
          <div className="status-indicator">
            <Cpu className="status-icon" />
            <div className="status-text-group">
              <span className="status-label">Backend</span>
              <span className={`status-value ${health ? 'online' : 'offline'}`}>
                {health ? 'Online' : 'Conectando...'}
              </span>
            </div>
          </div>

          <div className="divider" />

          <div className="status-indicator">
            <Key className={`status-icon ${isActive ? 'success' : 'warning'}`} />
            <div className="status-text-group">
              <span className="status-label">{providerLabel} API</span>
              <span className={`status-value ${isActive ? 'success' : 'warning'}`}>
                {hasUserKey ? 'Chave Ativa' : isServerConfigured ? 'Servidor (Padrão)' : 'Chave Pendente'}
              </span>
            </div>
            <button 
              className="btn-key-action"
              onClick={onOpenSettings}
              title={hasUserKey ? `Alterar ou remover sua chave do ${providerLabel}` : `Configurar sua chave do ${providerLabel}`}
            >
              {hasUserKey ? 'Alterar' : 'Configurar'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .header {
          padding: 24px 0;
          border-bottom: 1px solid var(--border-color);
          background: linear-gradient(180deg, rgba(11, 15, 25, 0.9) 0%, rgba(11, 15, 25, 0) 100%);
          margin-bottom: 32px;
        }
        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        .logo-group {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo-icon-wrapper {
          background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
          width: 48px;
          height: 48px;
          border-radius: var(--border-radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
        .logo-icon {
          width: 24px;
          height: 24px;
          color: white;
        }
        .animate-glow {
          animation: pulseGlow 3s infinite ease-in-out;
        }
        h1 {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.1;
          background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .subtitle {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .health-status-badge {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          gap: 16px;
          background: var(--bg-glass);
          border-radius: var(--border-radius-md);
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .status-icon {
          width: 18px;
          height: 18px;
          color: var(--text-muted);
        }
        .status-icon.success {
          color: var(--success);
        }
        .status-icon.warning {
          color: var(--warning);
        }
        .status-text-group {
          display: flex;
          flex-direction: column;
        }
        .status-label {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .status-value {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .status-value.success {
          color: var(--success);
        }
        .status-value.warning {
          color: var(--warning);
        }
        .status-value.online {
          color: var(--success);
        }
        .status-value.offline {
          color: var(--danger);
        }
        .divider {
          width: 1px;
          height: 24px;
          background-color: var(--border-color);
        }
        .btn-key-action {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 10px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          margin-left: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .btn-key-action:hover {
          color: var(--primary-hover);
          border-color: var(--primary);
          background: var(--primary-bg-light);
        }
        @media (max-width: 640px) {
          .header-container {
            flex-direction: column;
            align-items: flex-start;
          }
          .health-status-badge {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </header>
  );
}
