import { useEffect, useState } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { CardDetailsModal } from './components/CardDetailsModal';
import './Dashboard.css';interface Solicitacao {
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

interface KanbanColumn {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'fazendo' | 'done' | 'video-materiais' | 'cobertura-eventos' | 'arte' | 'aprovacao' | 'parado';
  color: string;
}

const getDepartmentColorClass = (department: string) => {
  switch (department?.toLowerCase()) {
    case 'marketing': return 'dept-marketing';
    case 'vendas': return 'dept-vendas';
    case 'rh': return 'dept-rh';
    case 'financeiro': return 'dept-financeiro';
    default: return 'dept-default';
  }
};

interface KanbanCardProps {
  item: Solicitacao;
  onCardClick: (item: Solicitacao) => void;
}

const KanbanCardComponent = ({ item, onCardClick, isOverlay = false }: KanbanCardProps & { isOverlay?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging || isOverlay ? 'grabbing' : 'grab',
    position: 'relative' as const,
    zIndex: isDragging || isOverlay ? 999 : 1,
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`kanban-card ${isDragging ? 'dragging' : ''} ${isOverlay ? 'overlay' : ''}`}
      onClick={() => !isDragging && onCardClick(item)}
    >
      <div className="card-header">
         <span className={`dept-badge ${getDepartmentColorClass(item.departamento)}`}>
           {item.departamento}
         </span>
         <span className="material-icons card-more">more_horiz</span>
      </div>

      <h4 className="card-title">{item.tipoSolicitacao}</h4>
      
      <div className="card-desc">
        {item.descricao}
      </div>

      <div className="card-footer">
         <div className="card-meta">
            {item.protocolo && (
              <span className="meta-item protocol" title="Protocolo">
                #{item.protocolo.split('-').pop()}
              </span>
            )}
            <span className="meta-item date" title="Data de Entrega">
              <span className="material-icons">event</span>
              {format(parseISO(item.dataEntrega), "dd/MM/yyyy")}
            </span>
         </div>
         
         {item.arquivoUrl && (
           <span className="material-icons attachment-icon">attach_file</span>
         )}
      </div>
    </button>
  );
};

interface KanbanColumnProps {
  column: KanbanColumn;
  cards: Solicitacao[];
  onCardClick: (item: Solicitacao) => void;
}

const KanbanColumnComponent = ({ column, cards, onCardClick }: KanbanColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.status,
  });

  const style = {
    backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    transition: 'background-color 0.2s ease',
    minHeight: '150px',
    border: isOver ? '2px dashed #3b82f6' : '2px dashed transparent'
  };

  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <div className="header-title-row">
          <span className="column-title">{column.title}</span>
          <span className="column-count">{cards.length}</span>
        </div>
        <div className="header-color-bar" style={{ backgroundColor: column.color }}></div>
      </div>
      
      <div 
        className="kanban-column-content"
        ref={setNodeRef}
        style={style}
      >
        {cards.map((item) => (
          <KanbanCardComponent 
            key={item.id} 
            item={item} 
            onCardClick={onCardClick} 
          />
        ))}
      </div>
    </div>
  );
};

export function Dashboard() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [selectedCard, setSelectedCard] = useState<Solicitacao | null>(null);

  const columns: KanbanColumn[] = [
    { id: 'todo', title: 'Novas solicitações', status: 'todo', color: '#fbbf24' }, // Amber/Yellow
    { id: 'video-materiais', title: 'Videos/Matérias', status: 'video-materiais', color: '#3b82f6' }, // Blue
    { id: 'cobertura-eventos', title: 'Cobertura de Eventos', status: 'cobertura-eventos', color: '#8b5cf6' }, // Violet
    { id: 'arte', title: 'Arte', status: 'arte', color: '#ec4899' }, // Pink
    { id: 'fazendo', title: 'Fazendo', status: 'fazendo', color: '#0ea5e9' }, // Sky Blue
    { id: 'aprovacao', title: 'A Aprovar', status: 'aprovacao', color: '#10b981' }, // Emerald
    { id: 'parado', title: 'Parado', status: 'parado', color: '#ef4444' }, // Red
    { id: 'done', title: 'Concluído', status: 'done', color: '#34d399' } // Emerald/Green
  ];

  // Pure async function to fetch data (defined inside or outside, but used to decouple)
  const fetchCardsData = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/cards');
      return response.data.map((item: Solicitacao) => ({
        ...item,
        id: String(item.id), // Ensure ID is a string for DnD
        status: item.status === 'in-progress' ? 'fazendo' : item.status,
        veiculacao: typeof item.veiculacao === 'string' 
          ? JSON.parse(item.veiculacao) 
          : item.veiculacao
      }));
    } catch (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const data = await fetchCardsData();
      if (isMounted) {
        setSolicitacoes(data);
      }
    };
    
    loadData();
    const interval = setInterval(loadData, 30000); // Polling update
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getCardsByStatus = (status: string) => {
    return solicitacoes.filter(item => item.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
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

    // In dnd-kit, over.id is the droppable id (column status)
    // We need to find the card to get its current status
    const activeCard = solicitacoes.find(s => s.id === activeId);
    if (!activeCard) return;

    const sourceStatus = activeCard.status;
    const destinationStatus = overId as Solicitacao['status'];

    if (sourceStatus === destinationStatus) return;

    console.log(`Moving card ${activeId} from ${sourceStatus} to ${destinationStatus}`);

    // Optimistic update
    setSolicitacoes(prev => prev.map(item => 
      item.id === activeId ? { ...item, status: destinationStatus } : item
    ));

    try {
      await axios.put(`http://localhost:3001/api/cards/${activeId}/status`, { status: destinationStatus });
      toast.success('Status atualizado!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status.');
      // Revert
      setSolicitacoes(prev => prev.map(item => 
        item.id === activeId ? { ...item, status: sourceStatus } : item
      ));
    }
  };

  const activeCard = activeId ? solicitacoes.find(s => s.id === activeId) : null;

  return (
    <div className="dashboard-container">      
      <div className="dashboard-header">
        <h1>Quadro de Solicitações</h1>
      </div>

      <DndContext 
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="kanban-board">
          {columns.map((column) => (
            <KanbanColumnComponent 
              key={column.id} 
              column={column} 
              cards={getCardsByStatus(column.status)}
              onCardClick={setSelectedCard}
            />
          ))}
        </div>
        
        {createPortal(
          <DragOverlay>
            {activeCard ? (
              <KanbanCardComponent
                item={activeCard}
                onCardClick={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {selectedCard && (
        <CardDetailsModal 
          card={selectedCard} 
          onClose={() => setSelectedCard(null)}
          onStatusChange={(id, status) => {
             // Wrapper to handle event object mismatch if needed, or direct call
             // The modal calls it as (id, status)
             // handleStatusChange expects (e, id, status)
             // We can create a dedicated handler or adapt here.
             // Adapting to reuse the logic but avoiding the event propagation stop which isn't needed in modal
             // Actually, let's just call the logic directly here or refactor handleStatusChange
             
             // Since handleStatusChange uses e.stopPropagation(), let's make a clean version
             const updateStatus = async () => {
                try {
                  await axios.put(`http://localhost:3001/api/cards/${id}/status`, { status });
                  const data = await fetchCardsData();
                  setSolicitacoes(data);
                  toast.success(`Status atualizado com sucesso!`);
                  setSelectedCard(null); // Close modal on success
                } catch (error) {
                  console.error('Error updating status:', error);
                  toast.error('Erro ao atualizar status.');
                }
             };
             updateStatus();
          }}
        />
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
