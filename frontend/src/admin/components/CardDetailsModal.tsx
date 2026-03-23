import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
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
  approvalStatus?: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
  approvalMessage?: string | null;
  approvalUpdatedAt?: string | null;
  createdAt: string;
}

interface CardDetailsModalProps {
  card: Solicitacao | null;
  onClose: () => void;
  stages?: Stage[];
  onAction?: (id: string, action: { type: 'move'; stageId: string } | { type: 'archive' } | { type: 'reopen' }) => void;
}

type ApprovalLinkField = {
  id: string;
  value: string;
};

type ApprovalHistoryItem = {
  id: string;
  createdAt: string;
  type: string;
  message: string;
  actorName: string | null;
  actorEmail: string | null;
  approvalStatus: 'APPROVED' | 'CHANGES_REQUESTED' | 'PENDING' | null;
  comment: string | null;
};

const createApprovalLinkField = (value = ''): ApprovalLinkField => {
  const rand = Math.random().toString(16).slice(2);
  return { id: `${Date.now()}-${rand}`, value };
};

export function CardDetailsModal({ card, onClose, onAction, stages }: Readonly<CardDetailsModalProps>) {
  const currentStageName = card?.stage?.name ?? '';
  const showApprovalForm = currentStageName === 'A Aprovar';
  const showApprovalHistory = currentStageName === 'A Aprovar' || currentStageName === 'Concluído';
  const [approvalLinks, setApprovalLinks] = useState<ApprovalLinkField[]>([createApprovalLinkField('')]);
  const [approvalText, setApprovalText] = useState('');
  const [sendingApproval, setSendingApproval] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryItem[]>([]);
  const [loadingApprovalHistory, setLoadingApprovalHistory] = useState(false);

  const suggestedApprovalLink = useMemo(() => {
    const raw = String(card?.arquivoUrl ?? '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('/')) return `${globalThis.location.origin}${raw}`;
    return raw;
  }, [card?.arquivoUrl]);

  useEffect(() => {
    if (!card || !showApprovalForm) {
      setApprovalLinks([createApprovalLinkField('')]);
      setApprovalText('');
      setSendingApproval(false);
      return;
    }
    const incoming = String(card.approvalMessage ?? '').trim();
    if (incoming) {
      setApprovalText((prev) => (prev.trim() ? prev : incoming));
    }
  }, [card, showApprovalForm, suggestedApprovalLink]);

  useEffect(() => {
    const cardId = card?.id;
    if (!cardId || !showApprovalHistory) return;
    setLoadingApprovalHistory(true);
    axios
      .get(`/api/cards/${cardId}/approval-history`)
      .then((response) => setApprovalHistory(response.data as ApprovalHistoryItem[]))
      .catch((error) => {
        console.error('Error fetching approval history:', error);
        setApprovalHistory([]);
      })
      .finally(() => setLoadingApprovalHistory(false));
  }, [card?.id, showApprovalHistory]);

  useEffect(() => {
    if (!card || !showApprovalHistory) {
      setApprovalHistory([]);
      setLoadingApprovalHistory(false);
    }
  }, [card, showApprovalHistory]);

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

          {showApprovalForm && (
            <div className="form-section">
              <div className="approval-header">
                <label htmlFor={approvalLinks[0] ? `approval-link-${approvalLinks[0].id}` : undefined}>Aprovação</label>
                <button
                  className="approval-add-btn"
                  type="button"
                  onClick={() => setApprovalLinks((prev) => [...(prev.length ? prev : [createApprovalLinkField('')]), createApprovalLinkField('')])}
                  aria-label="Adicionar link"
                >
                  <span className="material-icons" aria-hidden="true">
                    add
                  </span>
                </button>
              </div>

              {approvalLinks.map((field, index) => (
                <div key={field.id} className="approval-row">
                  <div className="approval-input">
                    <span className="material-icons" aria-hidden="true">
                      link
                    </span>
                    <input
                      id={`approval-link-${field.id}`}
                      value={field.value}
                      onChange={(e) => {
                        const next = e.target.value;
                        setApprovalLinks((prev) => prev.map((v) => (v.id === field.id ? { ...v, value: next } : v)));
                      }}
                      placeholder={index === 0 ? 'Link principal para aprovação' : 'Link adicional'}
                      type="text"
                      inputMode="url"
                      autoComplete="off"
                    />
                  </div>
                  <button
                    className="approval-copy-btn"
                    type="button"
                    onClick={async () => {
                      try {
                        if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
                          console.error('[approval] clipboard API not available');
                          toast.error('Seu navegador não permite colar automaticamente. Use Ctrl+V no campo.');
                          const el = document.getElementById(`approval-link-${field.id}`) as HTMLInputElement | null;
                          el?.focus();
                          return;
                        }
                        const pasted = await navigator.clipboard.readText();
                        const next = String(pasted || '').trim();
                        if (!next) {
                          toast.error('Área de transferência vazia.');
                          return;
                        }
                        setApprovalLinks((prev) => prev.map((v) => (v.id === field.id ? { ...v, value: next } : v)));
                        toast.success('Link colado!');
                      } catch (error) {
                        console.error('[approval] clipboard readText failed', error);
                        toast.error('Não foi possível colar automaticamente. Clique no campo e use Ctrl+V.');
                        const el = document.getElementById(`approval-link-${field.id}`) as HTMLInputElement | null;
                        el?.focus();
                      }
                    }}
                    aria-label="Colar link"
                  >
                    <span className="material-icons" aria-hidden="true">
                      content_paste
                    </span>
                  </button>
                  {index > 0 && (
                    <button
                      className="approval-remove-btn"
                      type="button"
                      onClick={() => setApprovalLinks((prev) => prev.filter((v) => v.id !== field.id))}
                      aria-label="Remover link"
                    >
                      <span className="material-icons" aria-hidden="true">
                        delete
                      </span>
                    </button>
                  )}
                </div>
              ))}
              <div className="approval-text">
                <textarea
                  value={approvalText}
                  onChange={(e) => setApprovalText(e.target.value)}
                  placeholder="Mensagem para o solicitante (opcional)"
                  rows={3}
                />
              </div>
              <div className="approval-actions">
                <button
                  className="approval-send-btn"
                  type="button"
                  disabled={sendingApproval || card.approvalStatus === 'APPROVED'}
                  title={card.approvalStatus === 'APPROVED' ? 'Projeto já aprovado. Não é necessário reenviar o email.' : undefined}
                  onClick={async () => {
                    if (!card.email) {
                      toast.error('Esta solicitação não possui email.');
                      return;
                    }
                    const links = approvalLinks.map((v) => v.value.trim()).filter(Boolean);
                    const primary = String(approvalLinks[0]?.value ?? '').trim();
                    if (!primary) {
                      toast.error('Informe o link principal para aprovação.');
                      return;
                    }
                    if (links.length === 0) {
                      toast.error('Informe ao menos um link.');
                      return;
                    }
                    setSendingApproval(true);
                    try {
                      await axios.post(`/api/cards/${card.id}/approval-email`, { links, message: approvalText });
                      toast.success('Email de aprovação enviado!');
                      onClose();
                    } catch (error) {
                      console.error('Error sending approval email:', error);
                      toast.error('Erro ao enviar email de aprovação.');
                    } finally {
                      setSendingApproval(false);
                    }
                  }}
                >
                  <span className="material-icons" aria-hidden="true">
                    send
                  </span>
                  <span>Enviar email ao solicitante</span>
                </button>
              </div>
            </div>
          )}

          {showApprovalHistory && (
            <div className="form-section">              
              <div className="approval-history">
                <div className="approval-history-header">
                  <span>Histórico</span>
                  {loadingApprovalHistory ? <span className="approval-history-loading">Carregando…</span> : null}
                </div>
                {approvalHistory.length === 0 && !loadingApprovalHistory ? (
                  <div className="approval-history-empty">Nenhum registro ainda.</div>
                ) : (
                  <div className="approval-history-list">
                    {approvalHistory.map((item) => {
                      const who = item.actorName || item.actorEmail || 'Usuário Externo';
                      const timeLabel = (() => {
                        try {
                          return format(parseISO(item.createdAt), 'dd/MM - HH:mm');
                        } catch {
                          return item.createdAt;
                        }
                      })();
                      let kind: 'approved' | 'changes' | 'edited' | 'sent' = 'sent';
                      let title = 'Enviou para aprovação';
                      if (item.approvalStatus === 'APPROVED') {
                        kind = 'approved';
                        title = 'Aprovou o projeto final';
                      } else if (item.approvalStatus === 'CHANGES_REQUESTED') {
                        kind = 'changes';
                        title = 'Solicitou alteração';
                      } else if (item.message === 'Prazo alterado.') {
                        kind = 'edited';
                        title = 'Editou a Solicitação';
                      }
                      return (
                        <div key={item.id} className={`approval-history-item ${kind}`}>
                          <div className="approval-history-time">{timeLabel}</div>
                          <div className="approval-history-card">
                            <div className="approval-history-who">
                              <span className="material-icons" aria-hidden="true">
                                link
                              </span>
                              <span>{who}</span>
                            </div>
                            <div className="approval-history-title">{title}</div>
                            {item.comment ? <div className="approval-history-comment">{item.comment}</div> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
                <button
                  className="action-btn btn-finish"
                  onClick={() => {
                    if (card.approvalStatus !== 'APPROVED') {
                      toast.warning('Esta solicitação ainda não foi aprovada. Aprovar antes de concluir.');
                      return;
                    }
                    onAction(card.id, { type: 'move', stageId: doneStageId });
                  }}
                  type="button"
                >
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
