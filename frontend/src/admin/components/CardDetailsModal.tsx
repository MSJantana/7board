import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './CardDetailsModal.css';

interface Stage {
  id: string;
  name: string;
}

interface Solicitacao {
  id: string;
  departamento: string;
  email?: string;
  protocolo?: string;
  tipoSolicitacao: string;
  descricao: string;
  veiculacao: string[] | string;
  deliveryAt: string;
  stage?: Stage | null;
  archivedAt?: string | null;
  observacoes?: string;
  arquivoUrl?: string;
  createdAt: string;
}

interface CardDetailsModalProps {
  card: Solicitacao | null;
  onClose: () => void;
  stages?: Stage[];
  onAction?: (id: string, action: { type: 'move'; stageId: string } | { type: 'archive' } | { type: 'reopen' }) => void;
}

export function CardDetailsModal({ card, onClose, onAction, stages }: Readonly<CardDetailsModalProps>) {
  if (!card) return null;

  const veiculacaoList = (() => {
    if (Array.isArray(card.veiculacao)) return card.veiculacao;
    if (typeof card.veiculacao === 'string') return JSON.parse(card.veiculacao);
    return [];
  })();

  const handleOverlayClick = () => {
    onClose();
  };

  const formattedDate = (() => {
    try {
      return format(parseISO(card.deliveryAt), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  })();

  const formattedTime = (() => {
    try {
      return format(parseISO(card.deliveryAt), 'HH:mm', { locale: ptBR });
    } catch {
      return '';
    }
  })();

  const doingStageId = stages?.find((s) => s.name === 'Fazendo')?.id ?? null;
  const doneStageId = stages?.find((s) => s.name === 'Concluído')?.id ?? null;
  const currentStageName = card.stage?.name ?? '';

  return createPortal(
    <div className="modal-backdrop">
      <button className="modal-overlay-btn" onClick={handleOverlayClick} aria-label="Fechar detalhes da solicitação" />
      <div className="modal-container">
        <div className="modal-header">
          <div className="header-title-group">
            <div className="header-icon">
              <span className="material-icons">event_note</span>
            </div>
            <h3>Detalhes da Solicitação</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Fechar modal" type="button">
            <span className="material-icons" aria-hidden="true">
              close
            </span>
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

          <div className="form-section">
            <label htmlFor="tipo-solicitacao-display">Tipo de Solicitação</label>
            <div className="custom-input-display">{card.tipoSolicitacao}</div>
          </div>

          <div className="form-section">
            <label htmlFor="descricao-display">Descrição</label>
            <div className="custom-input-display multiline">{card.descricao}</div>
          </div>

          <div className="form-section">
            <label htmlFor="data-hora-entrega-display">Data & Hora de Entrega</label>
            <div className="custom-input-display date-display">
              <span className="material-icons">calendar_today</span>
              {formattedDate}
            </div>
            {formattedTime && (
              <div className="time-row">
                <div className="custom-input-display time-display">
                  <span className="material-icons">schedule</span>
                  {formattedTime}
                </div>
              </div>
            )}
          </div>

          {card.stage?.name && (
            <div className="form-section">
              <label htmlFor="stage-display">Etapa</label>
              <div className="custom-input-display">
                <span className="material-icons">view_kanban</span>
                {card.stage.name}
              </div>
            </div>
          )}

          {veiculacaoList.length > 0 && (
            <div className="form-section">
              <label htmlFor="veiculacao-tags">Veiculação</label>
              <div className="tags-container">
                {veiculacaoList.map((v: string) => (
                  <span key={v} className="veiculacao-tag">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {card.observacoes && (
            <div className="form-section">
              <label htmlFor="observacoes-display">Observações</label>
              <div className="custom-input-display multiline secondary">{card.observacoes}</div>
            </div>
          )}

          {card.arquivoUrl && (
            <div className="form-section">
              <label htmlFor="anexos-display">Anexos</label>
              <a href={card.arquivoUrl || '#'} target="_blank" rel="noopener noreferrer" className="attachment-link">
                <span className="material-icons">attach_file</span>
                <span>Visualizar Anexo</span>
              </a>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {onAction && (
            <div className="modal-actions-left">
              {currentStageName === 'Novas solicitações' && doingStageId && (
                <button className="action-btn btn-production" onClick={() => onAction(card.id, { type: 'move', stageId: doingStageId })} type="button">
                  <span className="material-icons">engineering</span>
                  <span>Fazendo</span>
                </button>
              )}

              {currentStageName !== 'Concluído' && doneStageId && (
                <button className="action-btn btn-finish" onClick={() => onAction(card.id, { type: 'move', stageId: doneStageId })} type="button">
                  <span className="material-icons">check_circle</span>
                  <span>Concluido</span>
                </button>
              )}

              {currentStageName === 'Concluído' && (
                <button className="action-btn btn-reopen" onClick={() => onAction(card.id, { type: 'reopen' })} type="button">
                    <span className="material-icons">refresh</span>
                    <span>Reabrir</span>
                </button>
              )}

              {currentStageName === 'Concluído' && !card.archivedAt && (
                <button className="action-btn btn-archive" onClick={() => onAction(card.id, { type: 'archive' })} type="button">
                  <span className="material-icons">archive</span>
                  <span>Arquivar</span>
                </button>
              )}
            </div>
          )}
          <button className="cancel-btn" onClick={onClose} type="button">
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
