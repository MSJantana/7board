import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './CardDetailsModal.css';

interface Solicitacao {
  id: string;
  departamento: string;
  email?: string;
  protocolo?: string;
  tipoSolicitacao: string;
  descricao: string;
  veiculacao: string[] | string;
  dataEntrega: string;
  horarioEntrega?: string;
  observacoes?: string;
  arquivoUrl?: string;
  status: 'todo' | 'in-progress' | 'fazendo' | 'done' | 'archived' | 'video-materiais' | 'cobertura-eventos' | 'arte' | 'aprovacao' | 'parado';
  createdAt: string;
}

interface CardDetailsModalProps {
  card: Solicitacao | null;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export function CardDetailsModal({ card, onClose, onStatusChange }: Readonly<CardDetailsModalProps>) {
  if (!card) return null;

  const veiculacaoList = (() => {
    if (Array.isArray(card.veiculacao)) return card.veiculacao;
    if (typeof card.veiculacao === 'string') return JSON.parse(card.veiculacao);
    return [];
  })();

  // Handle click outside to close (now handled by overlay button)
  const handleOverlayClick = () => {
    onClose();
  };

  const formattedDate = (() => {
    try {
      return card.dataEntrega 
        ? format(parseISO(card.dataEntrega), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
        : 'Sem data';
    } catch {
      return card.dataEntrega || 'Data inválida';
    }
  })();

  return createPortal(
    <div className="modal-backdrop">
      <button 
        className="modal-overlay-btn"
        onClick={handleOverlayClick}
        aria-label="Fechar detalhes da solicitação"
      />
      <div className="modal-container">
        <div className="modal-header">
          <div className="header-title-group">
            <div className="header-icon">
              <span className="material-icons">event_note</span>
            </div>
            <h3>Detalhes da Solicitação</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">Visualize os dados abaixo</p>

          {card.protocolo && (
            <div className="form-section">
              <label htmlFor="protocolo-display">Protocolo</label>
              <div className="input-group-row">
                <div className="custom-input-display">
                  <span className="material-icons">fingerprint</span>
                  {card.protocolo}
                </div>
              </div>
            </div>
          )}

          {/* Departamento Section */}
          <div className="form-section">
            <label htmlFor="departamento-display">Departamento</label>
            <div className="input-group-row">
              <div className="custom-select-display">
                <span className="material-icons">people</span>
                {card.departamento}
              </div>
            </div>
          </div>

          {card.email && (
            <div className="form-section">
              <label htmlFor="email-display">Email</label>
              <div className="input-group-row">
                <div className="custom-input-display">
                  <span className="material-icons">email</span>
                  {card.email}
                </div>
              </div>
            </div>
          )}

          {/* Tipo e Descrição Section */}
          <div className="form-section">
            <label htmlFor="tipo-solicitacao-display">Tipo de Solicitação</label>
            <div className="custom-input-display">
              {card.tipoSolicitacao}
            </div>
          </div>

          <div className="form-section">
            <label htmlFor="descricao-display">Descrição</label>
            <div className="custom-input-display multiline">
              {card.descricao}
            </div>
          </div>

          {/* Date & Time Section */}
          <div className="form-section">
            <label htmlFor="data-hora-entrega-display">Data & Hora de Entrega</label>
            <div className="custom-input-display date-display">
              <span className="material-icons">calendar_today</span>
              {formattedDate}
            </div>
            {card.horarioEntrega && (
              <div className="time-row">
                <div className="custom-input-display time-display">
                  <span className="material-icons">schedule</span>
                  {card.horarioEntrega}
                </div>
              </div>
            )}
          </div>

          {/* Veiculação Section */}
          {veiculacaoList.length > 0 && (
            <div className="form-section">
              <label htmlFor="veiculacao-tags">Veiculação</label>
              <div className="tags-container">
                {veiculacaoList.map((v: string) => (
                  <span key={v} className="veiculacao-tag">{v}</span>
                ))}
              </div>
            </div>
          )}

          {/* Observações Section */}
          {card.observacoes && (
            <div className="form-section">
              <label htmlFor="observacoes-display">Observações</label>
              <div className="custom-input-display multiline secondary">
                {card.observacoes}
              </div>
            </div>
          )}

           {/* Anexos Section */}
           {card.arquivoUrl && (
            <div className="form-section">
              <label htmlFor="anexos-display">Anexos</label>
              <a 
                href={`http://localhost:3001${card.arquivoUrl}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="attachment-link"
              >
                <span className="material-icons">attach_file</span>
                <span>Visualizar Anexo</span>
              </a>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {onStatusChange && (
            <div className="modal-actions-left">
              {card.status === 'todo' && (
                <button 
                  className="action-btn btn-production" 
                  onClick={() => onStatusChange(card.id, 'fazendo')}
                >
                  <span className="material-icons">engineering</span>
                  <span>Fazendo</span>
                </button>
              )}
              
              {card.status !== 'done' && (
                <button 
                  className="action-btn btn-finish" 
                  onClick={() => onStatusChange(card.id, 'done')}
                >
                  <span className="material-icons">check_circle</span>
                  <span>Concluido</span>
                </button>
              )}

              {card.status === 'done' && (
                <>
                  <button 
                    className="action-btn btn-reopen" 
                    onClick={() => onStatusChange(card.id, 'todo')}
                  >
                    <span className="material-icons">refresh</span>
                    <span>Reabrir</span>
                  </button>
                  <button 
                    className="action-btn btn-archive" 
                    onClick={() => onStatusChange(card.id, 'archived')}
                  >
                    <span className="material-icons">archive</span>
                    <span>Arquivar</span>
                  </button>
                </>
              )}
            </div>
          )}
          <button className="cancel-btn" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
