import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle, FileQuestion, MessageSquare } from 'lucide-react';

export default function AuditPanel({ audit }) {
  if (!audit) return null;

  const { status, confianca, total_divergencias, divergencias, observacoes } = audit;
  const isApproved = status === 'APROVADO';

  const getConfiancaBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'alta':
        return <span className="badge badge-success">Confiança Alta</span>;
      case 'media':
      case 'média':
        return <span className="badge badge-warning">Confiança Média</span>;
      case 'baixa':
        return <span className="badge badge-danger">Confiança Baixa</span>;
      default:
        return <span className="badge badge-info">{level}</span>;
    }
  };

  const getDivergenciaBadge = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'dado_divergente':
        return <span className="badge badge-danger">Dado Divergente</span>;
      case 'alucinacao':
      case 'alucinação':
        return <span className="badge badge-danger">Alucinação</span>;
      case 'dado_ausente':
        return <span className="badge badge-warning">Dado Ausente</span>;
      default:
        return <span className="badge badge-info">{tipo}</span>;
    }
  };

  const getGravidadeIcon = (gravidade) => {
    switch (gravidade?.toLowerCase()) {
      case 'alta':
        return <AlertCircle className="grav-icon danger" />;
      case 'media':
      case 'média':
        return <AlertTriangle className="grav-icon warning" />;
      case 'baixa':
        return <FileQuestion className="grav-icon info" />;
      default:
        return <AlertCircle className="grav-icon" />;
    }
  };

  return (
    <div className="audit-panel-wrapper animate-fade-in">
      <div className={`audit-summary-card glass-panel ${isApproved ? 'approved' : 'requires-review'}`}>
        <div className="audit-main-status">
          <div className="status-badge-wrapper">
            {isApproved ? (
              <ShieldCheck className="main-status-icon success" />
            ) : (
              <ShieldAlert className="main-status-icon danger" />
            )}
          </div>
          
          <div className="status-text-details">
            <div className="status-line">
              <h3>{isApproved ? 'Aprovado pelo Double-Check' : 'Requer Revisão Manual'}</h3>
              <div className="badges-group">
                {getConfiancaBadge(confianca)}
                <span className={`badge ${total_divergencias === 0 ? 'badge-success' : 'badge-danger'}`}>
                  {total_divergencias} Divergência{total_divergencias !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <p className="status-description">
              {isApproved 
                ? 'O pipeline de dupla checagem comparou o Markdown e o documento original e não encontrou divergências clínicas críticas.'
                : 'A auditoria automática identificou divergências, valores omissos ou trechos ilegíveis. Por favor, verifique os pontos sinalizados abaixo.'}
            </p>
          </div>
        </div>

        {observacoes && (
          <div className="audit-notes-section">
            <div className="notes-header">
              <MessageSquare className="notes-icon" />
              <h4>Parecer da Auditoria</h4>
            </div>
            <p className="notes-content">{observacoes}</p>
          </div>
        )}
      </div>

      {/* Lista de divergências se houver */}
      {divergencias && divergencias.length > 0 && (
        <div className="divergencias-list-section glass-panel">
          <div className="section-header">
            <h3>Pontos de Controle de Segurança</h3>
            <span className="subtitle-desc">Divergências encontradas no Markdown original</span>
          </div>

          <div className="divergencias-list">
            {divergencias.map((div, index) => (
              <div key={index} className={`divergencia-item border-left-${div.gravidade || 'media'}`}>
                <div className="div-item-header">
                  <div className="div-meta">
                    {getGravidadeIcon(div.gravidade)}
                    {getDivergenciaBadge(div.tipo)}
                    {div.localizacao && <span className="location-tag">Localização: {div.localizacao}</span>}
                  </div>
                  <span className={`grav-badge grav-${div.gravidade}`}>Gravidade: {div.gravidade}</span>
                </div>

                <div className="div-diff-view">
                  <div className="diff-box original">
                    <span className="diff-label">Texto no Original:</span>
                    <p className="diff-text">{div.original || '[Não identificado]'}</p>
                  </div>
                  <div className="diff-box gerado">
                    <span className="diff-label">Texto no Markdown:</span>
                    <p className="diff-text">{div.gerado || '[Faltando ou omitido]'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .audit-panel-wrapper {
          width: 100%;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        /* Summary Card */
        .audit-summary-card {
          padding: 24px;
          position: relative;
          background: var(--bg-secondary);
        }
        .audit-summary-card.approved {
          border-left: 4px solid var(--success);
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, rgba(19, 26, 44, 0.1) 100%);
        }
        .audit-summary-card.requires-review {
          border-left: 4px solid var(--warning);
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.05) 0%, rgba(19, 26, 44, 0.1) 100%);
        }
        .audit-main-status {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }
        .status-badge-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: var(--border-radius-md);
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
        }
        .main-status-icon {
          width: 28px;
          height: 28px;
        }
        .main-status-icon.success {
          color: var(--success);
        }
        .main-status-icon.danger {
          color: var(--warning);
        }
        .status-text-details {
          flex-grow: 1;
        }
        .status-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 8px;
        }
        .status-line h3 {
          font-size: 18px;
          font-weight: 700;
        }
        .badges-group {
          display: flex;
          gap: 8px;
        }
        .status-description {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        
        /* Parecer */
        .audit-notes-section {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }
        .notes-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .notes-icon {
          width: 16px;
          height: 16px;
          color: var(--primary);
        }
        .notes-header h4 {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-primary);
        }
        .notes-content {
          font-size: 13px;
          color: var(--text-secondary);
          background: rgba(0, 0, 0, 0.2);
          padding: 10px 14px;
          border-radius: var(--border-radius-sm);
          font-style: italic;
        }
        
        /* Lista de Divergências */
        .divergencias-list-section {
          padding: 24px;
          background: var(--bg-secondary);
        }
        .section-header {
          margin-bottom: 20px;
        }
        .section-header h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .subtitle-desc {
          font-size: 12px;
          color: var(--text-muted);
        }
        .divergencias-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .divergencia-item {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          padding: 16px;
        }
        .divergencia-item.border-left-alta {
          border-left: 3px solid var(--danger);
        }
        .divergencia-item.border-left-media {
          border-left: 3px solid var(--warning);
        }
        .divergencia-item.border-left-baixa {
          border-left: 3px solid var(--info);
        }
        .div-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .div-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .grav-icon {
          width: 16px;
          height: 16px;
        }
        .grav-icon.danger {
          color: var(--danger);
        }
        .grav-icon.warning {
          color: var(--warning);
        }
        .grav-icon.info {
          color: var(--info);
        }
        .location-tag {
          font-size: 11px;
          color: var(--text-muted);
          background: var(--bg-primary);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .grav-badge {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .grav-badge.grav-alta {
          color: #fca5a5;
        }
        .grav-badge.grav-media {
          color: #fde047;
        }
        .grav-badge.grav-baixa {
          color: #67e8f9;
        }
        
        .div-diff-view {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          background: var(--bg-primary);
          padding: 12px;
          border-radius: var(--border-radius-sm);
        }
        .diff-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .diff-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
        }
        .diff-text {
          font-size: 12.5px;
          color: var(--text-primary);
          line-height: 1.4;
          font-family: var(--font-mono);
          word-break: break-all;
        }
        .diff-box.original {
          border-right: 1px solid var(--border-color);
          padding-right: 14px;
        }
        @media (max-width: 640px) {
          .div-diff-view {
            grid-template-columns: 1fr;
          }
          .diff-box.original {
            border-right: none;
            border-bottom: 1px solid var(--border-color);
            padding-right: 0;
            padding-bottom: 12px;
          }
        }
      `}</style>
    </div>
  );
}
