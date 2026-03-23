import { useEffect, useState } from 'react';
import axios from 'axios';
import { format, parseISO, isValid, differenceInHours } from 'date-fns';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { CardDetailsModal } from './components/CardDetailsModal';
import { getCachedCards, normalizeCardsFromApi, setCachedCards } from './services/adminCache';
import { getDefaultStageIds, type Stage as StageModel } from './services/stageUtils';
import './Dashboard.css';

interface Solicitacao {
  id: string;
  departamento: string;
  email?: string;
  protocolo?: string;
  tipoSolicitacao: string;
  descricao: string;
  veiculacao: string[] | string;
  deliveryAt: string;
  stageId: string;
  stage?: Stage | null;
  observacoes?: string;
  arquivoUrl?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
  approvalMessage?: string | null;
  approvalUpdatedAt?: string | null;
  createdAt: string;
  archivedAt?: string | null;
}

type Stage = StageModel;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const getTimeline = (createdAtRaw: string, deliveryAtRaw: string) => {
  const start = parseISO(createdAtRaw);
  const end = parseISO(deliveryAtRaw);
  if (!isValid(start) || !isValid(end)) return null;

  const startMs = start.getTime();
  const endMs = end.getTime();
  if (endMs <= startMs) return null;

  const nowMs = Date.now();
  const ratio = clamp((nowMs - startMs) / (endMs - startMs), 0, 1);
  const msLeft = endMs - nowMs;
  const isOverdue = nowMs >= endMs;
  const isWarning = msLeft > 0 && msLeft <= 72 * 60 * 60 * 1000;
  return { start, end, ratio, isOverdue, isWarning };
};

const getStageColor = (name: string) => {
  switch (name) {
    case 'Novas solicitações':
      return '#fbbf24';
    case 'Videos/Matérias':
      return '#3b82f6';
    case 'Cobertura de Eventos':
      return '#8b5cf6';
    case 'Arte':
      return '#ec4899';
    case 'Fazendo':
      return '#0ea5e9';
    case 'A Aprovar':
      return '#10b981';
    case 'Parado':
      return '#ef4444';
    case 'Concluído':
      return '#34d399';
    default:
      return '#94a3b8';
  }
};

const getDepartmentColorClass = (department: string) => {
  switch (department?.toLowerCase()) {
    case 'marketing':
      return 'dept-marketing';
    case 'vendas':
      return 'dept-vendas';
    case 'rh':
      return 'dept-rh';
    case 'financeiro':
      return 'dept-financeiro';
    default:
      return 'dept-default';
  }
};

interface KanbanCardProps {
  item: Solicitacao;
  onCardClick: (item: Solicitacao) => void;
}

const calculateCardStatus = (item: Solicitacao) => {
  const deliveryDate = parseISO(item.deliveryAt);
  let hoursLeft = 1000;
  let isOverdue = false;

  if (isValid(deliveryDate)) {
    const targetDate = deliveryDate;
    isOverdue = new Date() > targetDate;
    hoursLeft = differenceInHours(targetDate, new Date());
  }

  const isActive = !item.archivedAt;
  const isAdjusted = Boolean(item.observacoes?.toLowerCase().includes('prazo alterado'));
  const isWarning = hoursLeft <= 72 && hoursLeft > 0 && isActive;
  const isUrgent = hoursLeft < 24 && isActive;
  const showOverdueCard = isOverdue && isActive;
  const showAdjustedCard = isAdjusted && isActive && !isOverdue;

  let statusText = '';
  if (showOverdueCard) {
    statusText = 'Atrasada.';
  } else if (showAdjustedCard) {
    statusText = 'Prazo alterado.';
  } else if (isWarning) {
    statusText = 'Prazo próximo.';
  } else if (isUrgent) {
    statusText = 'Urgente.';
  }

  return { isUrgent, isWarning, showOverdueCard, showAdjustedCard, statusText };
};

const KanbanCardComponent = ({ item, onCardClick, isOverlay = false }: KanbanCardProps & { isOverlay?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging || isOverlay ? 'grabbing' : 'grab',
    position: 'relative' as const,
    zIndex: isDragging || isOverlay ? 999 : 1,
  };

  const { isUrgent, isWarning, showOverdueCard, showAdjustedCard, statusText } = calculateCardStatus(item);
  const timeline = getTimeline(item.createdAt, item.deliveryAt);
  let timelineStateClass = '';
  if (timeline) {
    if (timeline.isOverdue) {
      timelineStateClass = 'overdue';
    } else if (timeline.isWarning) {
      timelineStateClass = 'warning';
    }
  }

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`kanban-card ${isDragging ? 'dragging' : ''} ${isOverlay ? 'overlay' : ''} ${showOverdueCard ? 'overdue' : ''} ${!showOverdueCard && isWarning ? 'warning' : ''}`}
      onClick={() => !isDragging && onCardClick(item)}
      aria-label={`Solicitação ${item.tipoSolicitacao} para ${item.departamento}. ${statusText}`}
    >
      <div className="card-header">
        <span className={`dept-badge ${getDepartmentColorClass(item.departamento)}`}>{item.departamento}</span>
        <span className="material-icons card-more" aria-hidden="true">
          more_horiz
        </span>
      </div>

      <h4 className="card-title">{item.tipoSolicitacao}</h4>

      <div className="card-desc">{item.descricao}</div>

      {item.approvalStatus && item.approvalStatus !== 'PENDING' && (
        <div className={`approval-indicator ${item.approvalStatus === 'APPROVED' ? 'approved' : 'changes'}`}>
          <span className="material-icons" aria-hidden="true">
            {item.approvalStatus === 'APPROVED' ? 'thumb_up' : 'thumb_down'}
          </span>
        </div>
      )}

      {showOverdueCard && (
        <div
          className="card-alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#dc2626',
            fontSize: '12px',
            marginTop: '8px',
            fontWeight: 600,
          }}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            error
          </span>
          <span>Prazo vencido</span>
        </div>
      )}

      {showAdjustedCard && (
        <div className="card-alert warning">
          <span className="material-icons" style={{ fontSize: '16px' }}>
            schedule
          </span>
          <span>Prazo alterado</span>
        </div>
      )}

      {timeline && (
        <div className="card-timeline" aria-label="Progresso até a entrega">
          <div className="card-timeline-labels">
            <span>{format(timeline.start, 'dd/MM HH:mm')}</span>
            <span>{format(timeline.end, 'dd/MM HH:mm')}</span>
          </div>
          <div className={`card-timeline-track ${timelineStateClass}`}>
            <div
              className="card-timeline-fill"
              style={{
                width: `${Math.round(timeline.ratio * 100)}%`,
              }}
            />
            <span className="card-timeline-dot start" aria-hidden="true" />
            <span
              className={`card-timeline-dot end ${timelineStateClass}`}
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      <div className="card-footer">
        <div className="card-meta">
          {item.protocolo && (
            <span className="meta-item protocol" title="Protocolo">
              #{item.protocolo.split('-').pop()}
            </span>
          )}
          <span
            className="meta-item date"
            title={isUrgent ? 'Data de Entrega (Urgente)' : 'Data de Entrega'}
            style={{ color: isUrgent ? '#e74c3c' : 'inherit', fontWeight: isUrgent ? 'bold' : 'normal' }}
            aria-label={
              isUrgent
                ? `Entrega urgente: ${format(parseISO(item.deliveryAt), 'dd/MM/yyyy')}`
                : `Data de entrega: ${format(parseISO(item.deliveryAt), 'dd/MM/yyyy')}`
            }
          >
            <span className="material-icons" style={{ color: isUrgent ? '#e74c3c' : 'inherit' }} aria-hidden="true">
              event
            </span>
            {format(parseISO(item.deliveryAt), 'dd/MM/yyyy')}
          </span>
        </div>

        {item.arquivoUrl && (
          <span className="material-icons attachment-icon" aria-hidden="true">
            attach_file
          </span>
        )}
      </div>
    </button>
  );
};

interface KanbanColumnProps {
  stage: Stage;
  cards: Solicitacao[];
  onCardClick: (item: Solicitacao) => void;
}

const KanbanColumnComponent = ({ stage, cards, onCardClick }: KanbanColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: stage.id,
  });

  const style = {
    backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    transition: 'background-color 0.2s ease',
    minHeight: '150px',
    border: isOver ? '2px dashed #3b82f6' : '2px dashed transparent',
  };

  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <div className="header-title-row">
          <span className="column-title">{stage.name}</span>
          <span className="column-count">{cards.length}</span>
        </div>
        <div className="header-color-bar" style={{ backgroundColor: getStageColor(stage.name) }} />
      </div>

      <div className="kanban-column-content" ref={setNodeRef} style={style}>
        {cards.map((item) => (
          <KanbanCardComponent key={item.id} item={item} onCardClick={onCardClick} />
        ))}
      </div>
    </div>
  );
};

export function Dashboard() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>(() => (getCachedCards() as Solicitacao[]) ?? []);
  const [selectedCard, setSelectedCard] = useState<Solicitacao | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStagesData = async () => {
    try {
      const response = await axios.get('/api/stages', { params: { boardKey: 'default', active: true } });
      return response.data as Stage[];
    } catch (error) {
      console.error('Error fetching stages:', error);
      return [];
    }
  };

  const fetchCardsData = async () => {
    try {
      const response = await axios.get('/api/cards');
      const normalized = normalizeCardsFromApi(response.data as unknown[]);
      setCachedCards(normalized);
      return normalized.map((item: unknown) => {
        const raw = item as Record<string, unknown>;
        return { ...raw, id: String(raw.id) } as Solicitacao;
      });
    } catch (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const data = await fetchCardsData();
      const stageData = await fetchStagesData();
      if (isMounted) {
        setSolicitacoes(data);
        setStages(stageData);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getCardsByStageId = (stageId: string) => {
    return solicitacoes
      .filter((item) => !item.archivedAt && item.stageId === stageId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const refreshCardsSoft = async () => {
    setRefreshing(true);
    try {
      const data = await fetchCardsData();
      setSolicitacoes(data);
    } finally {
      globalThis.setTimeout(() => setRefreshing(false), 250);
    }
  };

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCard = solicitacoes.find((s) => s.id === activeId);
    if (!activeCard) return;

    if (activeCard.stageId === overId) return;

    const overStage = stages.find((s) => s.id === overId);
    if (overStage?.kind === 'DONE' && activeCard.approvalStatus !== 'APPROVED') {
      toast.warning('Esta solicitação ainda não foi aprovada. Aprovar antes de concluir.');
      return;
    }

    setSolicitacoes((prev) => prev.map((item) => (item.id === activeId ? { ...item, stageId: overId } : item)));

    try {
      const response = await axios.put(`/api/cards/${activeId}/status`, { stageId: overId });
      const normalized = normalizeCardsFromApi([response.data as unknown])[0] as Solicitacao;
      setSolicitacoes((prev) => prev.map((item) => (item.id === activeId ? { ...item, ...normalized } : item)));
      toast.success('Status atualizado!');
      void refreshCardsSoft();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status.');
      setSolicitacoes((prev) =>
        prev.map((item) => (item.id === activeId ? { ...item, stageId: activeCard.stageId } : item))
      );
    }
  };

  const activeCard = activeId ? solicitacoes.find((s) => s.id === activeId) : null;

  return (
    <div className="dashboard-container">
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className={`kanban-board ${refreshing ? 'refreshing' : ''}`}>
          {stages
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((stage) => (
              <KanbanColumnComponent key={stage.id} stage={stage} cards={getCardsByStageId(stage.id)} onCardClick={setSelectedCard} />
            ))}
        </div>

        {createPortal(
          <DragOverlay>
            {activeCard ? <KanbanCardComponent item={activeCard} onCardClick={() => {}} isOverlay /> : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {selectedCard && (
        <CardDetailsModal
          card={selectedCard}
          stages={stages}
          onClose={() => setSelectedCard(null)}
          onAction={(id, action) => {
            const { todoId } = getDefaultStageIds(stages);
            const update = async () => {
              if (action.type === 'move') {
                await axios.put(`/api/cards/${id}/status`, { stageId: action.stageId });
                return;
              }
              if (action.type === 'archive') {
                await axios.put(`/api/cards/${id}/status`, { archived: true });
                return;
              }
              if (action.type === 'reopen') {
                if (!todoId) {
                  throw new Error('Stage TODO não encontrada');
                }
                await axios.put(`/api/cards/${id}/status`, { archived: false, stageId: todoId });
              }
            };

            void update()
              .then(async () => {
                toast.success('Atualizado!');
                const response = await axios.get(`/api/cards/${id}`);
                setSelectedCard(response.data as Solicitacao);
                await refreshCardsSoft();
              })
              .catch((error) => {
                console.error('Error updating status:', error);
                toast.error('Erro ao atualizar.');
              });
          }}
        />
      )}
    </div>
  );
}
