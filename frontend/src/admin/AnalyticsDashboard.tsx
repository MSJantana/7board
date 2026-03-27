import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { PieChart, Pie, ResponsiveContainer, Tooltip } from 'recharts';
import { differenceInHours, parseISO } from 'date-fns';
import { getCachedCards, normalizeCardsFromApi } from './services/adminCache';
import './AnalyticsDashboard.css';

interface Solicitacao {
  id: string;
  departamento: string;
  email?: string;
  protocolo?: string;
  tipoSolicitacao: string;
  descricao: string;
  deliveryAt: string;
  stageId: string;
  stage?: { id: string; name: string; kind: string } | null;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
  createdAt: string;
  archivedAt?: string | null;
  completedAt?: string | null;
}

export function AnalyticsDashboard() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>(() => (getCachedCards() as Solicitacao[]) ?? []);
  const [loading, setLoading] = useState(false);
  const [tasksPage, setTasksPage] = useState(1);

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/cards');
        const normalized = normalizeCardsFromApi(response.data as unknown[]);
        setSolicitacoes(normalized as unknown as Solicitacao[]);
      } catch (error) {
        console.error('Error fetching cards for analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  // Mapear dados
  const metrics = useMemo(() => {
    const total = solicitacoes.length;
    let completed = 0;
    let inProgress = 0;
    let behind = 0;

    const now = new Date();

    solicitacoes.forEach((card) => {
      const stageName = card.stage?.name ?? '';
      const normalizedStageName = stageName
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      const isDone =
        Boolean(card.completedAt) ||
        Boolean(card.archivedAt) ||
        card.stage?.kind === 'DONE' ||
        normalizedStageName === 'concluido';
      
      if (isDone) {
        completed++;
      } else {
        const deliveryDate = parseISO(card.deliveryAt);
        const hoursLeft = differenceInHours(deliveryDate, now);
        
        if (hoursLeft < 0) {
          behind++;
        } else {
          inProgress++;
        }
      }
    });

    const getPercent = (val: number) => total === 0 ? 0 : Number(((val / total) * 100).toFixed(1));

    return {
      total,
      completed,
      completedPercent: getPercent(completed),
      inProgress,
      inProgressPercent: getPercent(inProgress),
      behind,
      behindPercent: getPercent(behind),
    };
  }, [solicitacoes]);

  const chartData = [
    { name: 'Concluído', value: metrics.completed, fill: '#1e293b' }, // Escuro
    { name: 'Em Andamento', value: metrics.inProgress, fill: '#3b82f6' }, // Azul
    { name: 'Atrasado', value: metrics.behind, fill: '#a7f3d0' }, // Verde claro
  ].filter(item => item.value > 0);

  // Fallback caso não tenha dados para mostrar algo visualmente
  const displayChartData = chartData.length > 0 ? chartData : [{ name: 'Sem dados', value: 1, fill: '#e2e8f0' }];

  const tasksPageSize = 5;

  const sortedTasks = useMemo(() => {
    return [...solicitacoes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [solicitacoes]);

  const tasksTotal = sortedTasks.length;
  const tasksTotalPages = Math.max(1, Math.ceil(tasksTotal / tasksPageSize));
  const safeTasksPage = Math.min(tasksPage, tasksTotalPages);
  const tasksStartIndex = (safeTasksPage - 1) * tasksPageSize;
  const tasksEndIndex = Math.min(tasksStartIndex + tasksPageSize, tasksTotal);

  useEffect(() => {
    if (tasksPage !== safeTasksPage) setTasksPage(safeTasksPage);
  }, [safeTasksPage, tasksPage]);

  const pagedTasks = useMemo(() => {
    return sortedTasks.slice(tasksStartIndex, tasksEndIndex);
  }, [sortedTasks, tasksStartIndex, tasksEndIndex]);

  const getTaskStatusInfo = (card: Solicitacao) => {
    if (card.stage?.kind === 'DONE' || card.archivedAt) {
      return { text: 'Concluído', color: '#10b981' };
    }
    
    const deliveryDate = parseISO(card.deliveryAt);
    const hoursLeft = differenceInHours(deliveryDate, new Date());
    
    if (card.stage?.kind === 'VALIDATION') {
      if (card.approvalStatus === 'APPROVED') return { text: 'Aprovado', color: '#f59e0b' };
      if (card.approvalStatus === 'CHANGES_REQUESTED') return { text: 'Ajustes', color: '#ef4444' };
      return { text: 'Pendente', color: '#3b82f6' };
    }

    if (hoursLeft < 0) {
      return { text: 'Atrasado', color: '#1e293b' };
    }

    return { text: 'Em Andamento', color: '#8b5cf6' };
  };

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="analytics-container">
      <div className="analytics-grid">
        
        {/* Project Status Card (Gráfico) */}
        <div className="analytics-card">
          <h2 className="card-title">Status dos Projetos</h2>
          
          <div className="chart-wrapper">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  />
                  <Tooltip 
                    formatter={(value: any, name: any) => {
                      const nameStr = name === undefined ? '' : String(name);
                      const val = value === undefined ? 0 : value;
                      if (nameStr === 'Sem dados') return ['0', 'Total'];
                      return [val as number, nameStr];
                    }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-label">
                  <span className="legend-dot" style={{ backgroundColor: '#1e293b' }}></span>
                  <span>Concluído</span>
                </div>
                <span className="legend-value">{metrics.completedPercent}%</span>
              </div>
              
              <div className="legend-item">
                <div className="legend-label">
                  <span className="legend-dot" style={{ backgroundColor: '#3b82f6' }}></span>
                  <span>Em Andamento</span>
                </div>
                <span className="legend-value">{metrics.inProgressPercent}%</span>
              </div>
              
              <div className="legend-item">
                <div className="legend-label">
                  <span className="legend-dot" style={{ backgroundColor: '#a7f3d0' }}></span>
                  <span>Atrasado</span>
                </div>
                <span className="legend-value">{metrics.behindPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List Card */}
        <div className="analytics-card">
          <h2 className="card-title">Tarefas</h2>
          
          <div className="tasks-table-wrapper">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Atribuído a</th>
                  <th>Data de Entrega</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedTasks.map(task => {
                  const statusInfo = getTaskStatusInfo(task);
                  const deliveryDateStr = new Date(task.deliveryAt).toLocaleDateString('pt-BR');
                  
                  return (
                    <tr key={task.id}>
                      <td>
                        <div className="task-title">{task.tipoSolicitacao}</div>
                      </td>
                      <td>
                        <div className="task-assignee">
                          <div className="assignee-avatar" title={task.email || 'Usuário'}>
                            {getInitials(task.email)}
                          </div>
                        </div>
                      </td>
                      <td>
                        {deliveryDateStr}
                      </td>
                      <td>
                        <div className="task-status" style={{ color: statusInfo.color }}>
                          <span className="status-dot" style={{ backgroundColor: statusInfo.color }}></span>
                          {statusInfo.text}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sortedTasks.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '30px' }}>
                      Nenhuma solicitação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {sortedTasks.length > tasksPageSize && (
            <div className="tasks-pagination">
              <div className="tasks-pagination-info">
                Mostrando {tasksStartIndex + 1}-{tasksEndIndex} de {tasksTotal}
              </div>
              <div className="tasks-pagination-controls">
                <button
                  type="button"
                  className="tasks-pagination-btn"
                  disabled={safeTasksPage === 1}
                  onClick={() => setTasksPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <div className="tasks-pagination-page">
                  Página {safeTasksPage} de {tasksTotalPages}
                </div>
                <button
                  type="button"
                  className="tasks-pagination-btn"
                  disabled={safeTasksPage === tasksTotalPages}
                  onClick={() => setTasksPage(p => Math.min(tasksTotalPages, p + 1))}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
