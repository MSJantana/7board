import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import './Approval.css';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';

type ApprovalCard = {
  id: string;
  departamento: string;
  email?: string | null;
  protocolo?: string | null;
  tipoSolicitacao: string;
  deliveryAt: string;
  approvalStatus: ApprovalStatus;
  approvalMessage?: string | null;
  approvalUpdatedAt?: string | null;
};

const getApiErrorMessage = (data: unknown) => {
  if (!data || typeof data !== 'object') return '';
  const record = data as Record<string, unknown>;
  return typeof record.error === 'string' ? record.error.trim() : '';
};

export function Approval() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const token = String(params.get('token') ?? '').trim();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>('');
  const [card, setCard] = useState<ApprovalCard | null>(null);
  const [links, setLinks] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedDecision, setSubmittedDecision] = useState<'APPROVED' | 'CHANGES_REQUESTED' | null>(null);

  const formattedDelivery = useMemo(() => {
    if (!card?.deliveryAt) return '';
    try {
      return format(parseISO(card.deliveryAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return card.deliveryAt;
    }
  }, [card?.deliveryAt]);

  useEffect(() => {
    const cardId = String(id ?? '').trim();
    if (!cardId || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    axios
      .get(`/api/approval/${cardId}`, { params: { token } })
      .then((response) => {
        const data = response.data as { card: ApprovalCard; links: string[] };
        setCard(data.card);
        setLinks(Array.isArray(data.links) ? data.links : []);
      })
      .catch((error) => {
        const message = (() => {
          if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const serverError = getApiErrorMessage(error.response?.data);
            if (serverError) return serverError;
            if (typeof status === 'number') {
              return `Falha ao carregar (HTTP ${status}).`;
            }
          }
          return 'Falha ao carregar.';
        })();
        console.error('Error fetching approval data:', error);
        setCard(null);
        setLinks([]);
        setLoadError(message);
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  if (!id || !token) {
    return (
      <div className="approval-page">
        <div className="approval-card">
          <h1>Link inválido</h1>
          <p>Este link de aprovação está incompleto.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="approval-page">
        <div className="approval-card">
          <h1>Carregando…</h1>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="approval-page">
        <div className="approval-card">
          <h1>Não foi possível abrir</h1>
          <p>{loadError || 'Este link pode ter expirado ou não é válido.'}</p>
        </div>
      </div>
    );
  }

  const canSubmit = !submitting && !submitted;
  const primaryLink = links[0] ? String(links[0]).trim() : '';

  const submit = async (decision: 'APPROVED' | 'CHANGES_REQUESTED') => {
    if (!canSubmit) return;
    if (decision === 'CHANGES_REQUESTED' && !comment.trim()) {
      toast.error('Descreva os ajustes necessários.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/api/approval/respond', { token, decision, comment });
      setSubmitted(true);
      setSubmittedDecision(decision);
      setComment('');
      setLinks([]);
      toast.success(decision === 'APPROVED' ? 'Aprovado com sucesso!' : 'Ajustes enviados com sucesso!');
    } catch (error) {
      console.error('Error submitting approval:', error);
      toast.error('Erro ao enviar sua resposta.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const decisionLabel =
      submittedDecision === 'APPROVED'
        ? 'Aprovação registrada.'
        : submittedDecision === 'CHANGES_REQUESTED'
          ? 'Solicitação de ajustes registrada.'
          : 'Resposta registrada.';

    const handleOk = () => {
      try {
        window.close();
      } catch {
        // ignore
      }
      setTimeout(() => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = '/';
        }
      }, 100);
    };

    return (
      <div className="approval-page">
        <div className="approval-card">
          <div className="approval-header">
            <h1>Solicitação enviada</h1>
            <button type="button" className="approval-badge status-approved approval-close-btn" onClick={handleOk}>
              OK
            </button>
          </div>
          <div className="approval-success">
            {decisionLabel} Você pode fechar esta página.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="approval-page">
      <div className="approval-card">
        <div className="approval-header">
          <h1>Aprovação</h1>
          <div className={`approval-badge status-${card.approvalStatus.toLowerCase()}`}>{card.approvalStatus}</div>
        </div>

        <div className="approval-meta">
          <div className="meta-row">
            <span className="meta-label">Protocolo</span>
            <span className="meta-value">{card.protocolo || '-'}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Departamento</span>
            <span className="meta-value">{card.departamento}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Tipo</span>
            <span className="meta-value">{card.tipoSolicitacao}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Entrega</span>
            <span className="meta-value">{formattedDelivery || '-'}</span>
          </div>
        </div>

        {links.length > 0 ? (
          <div className="approval-links">
            <h2>Links para revisão</h2>
            {primaryLink && (
              <a className="approval-open-primary" href={primaryLink} target="_blank" rel="noopener noreferrer">
                <span className="material-icons" aria-hidden="true">
                  open_in_new
                </span>
                <span>Abrir material para revisão</span>
              </a>
            )}

            <div className="approval-links-list">
              {links.map((l) => (
                <div key={l} className="approval-link-item">
                  <a href={l} target="_blank" rel="noopener noreferrer">
                    {l}
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="approval-links">
            <h2>Links para revisão</h2>
            <p>Nenhum link foi informado.</p>
          </div>
        )}

        <div className="approval-comment">
          <h2>Comentário</h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Se precisar de ajustes, descreva aqui."
            rows={4}
            disabled={!canSubmit}
          />
        </div>

        <div className="approval-actions">
          <button className="btn-approve" type="button" disabled={!canSubmit} onClick={() => submit('APPROVED')}>
            <span className="material-icons" aria-hidden="true">
              thumb_up
            </span>
            <span>Aprovar</span>
          </button>
          <button className="btn-changes" type="button" disabled={!canSubmit} onClick={() => submit('CHANGES_REQUESTED')}>
            <span className="material-icons" aria-hidden="true">
              thumb_down
            </span>
            <span>Solicitar ajustes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
