import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { PieChart, Pie, ResponsiveContainer, Tooltip } from 'recharts';
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

type DashboardStatus = 'Novas Solicitações' | 'Fazendo' | 'Pendente de aprovação' | 'Parado' | 'Concluído';

const normalizeStageName = (name: string) => {
  return name
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const getDashboardStatus = (card: Solicitacao): DashboardStatus => {
  const stageName = card.stage?.name ?? '';
  const normalizedStageName = normalizeStageName(stageName);

  const isDone =
    Boolean(card.completedAt) ||
    Boolean(card.archivedAt) ||
    card.stage?.kind === 'DONE' ||
    normalizedStageName === 'concluido';

  if (isDone) return 'Concluído';

  if (normalizedStageName === 'a aprovar' || card.stage?.kind === 'VALIDATION') {
    return 'Pendente de aprovação';
  }

  if (normalizedStageName === 'parado') {
    return 'Parado';
  }

  if (normalizedStageName === 'novas solicitacoes' || card.stage?.kind === 'TODO') {
    return 'Novas Solicitações';
  }

  if (
    normalizedStageName === 'videos/materias' ||
    normalizedStageName === 'cobertura de eventos' ||
    normalizedStageName === 'arte' ||
    normalizedStageName === 'fazendo'
  ) {
    return 'Fazendo';
  }

  if (card.stage?.kind === 'IN_PROGRESS') return 'Fazendo';

  return 'Fazendo';
};

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
    let novas = 0;
    let fazendo = 0;
    let pendente = 0;
    let parado = 0;
    let concluido = 0;

    solicitacoes.forEach((card) => {
      const status = getDashboardStatus(card);
      if (status === 'Concluído') concluido++;
      else if (status === 'Parado') parado++;
      else if (status === 'Pendente de aprovação') pendente++;
      else if (status === 'Novas Solicitações') novas++;
      else fazendo++;
    });

    const getPercent = (val: number) => total === 0 ? 0 : Number(((val / total) * 100).toFixed(1));

    return {
      total,
      novas,
      novasPercent: getPercent(novas),
      fazendo,
      fazendoPercent: getPercent(fazendo),
      pendente,
      pendentePercent: getPercent(pendente),
      parado,
      paradoPercent: getPercent(parado),
      concluido,
      concluidoPercent: getPercent(concluido),
    };
  }, [solicitacoes]);

  const chartData = [
    { name: 'Concluído', value: metrics.concluido, fill: '#1f854dff' },
    { name: 'Fazendo', value: metrics.fazendo, fill: '#767B91' },
    { name: 'Novas Solicitações', value: metrics.novas, fill: '#1C99E0' },
    { name: 'Pendente de aprovação', value: metrics.pendente, fill: '#F4D35E' },
    { name: 'Parado', value: metrics.parado, fill: '#ef4444' },
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
    const status = getDashboardStatus(card);
    if (status === 'Concluído') return { text: status, color: '#1f854dff' };
    if (status === 'Fazendo') return { text: status, color: '#767B91' };
    if (status === 'Novas Solicitações') return { text: status, color: '#1C99E0' };
    if (status === 'Pendente de aprovação') return { text: status, color: '#F4D35E' };
    return { text: status, color: '#ef4444' };
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
                  <span className="legend-dot" style={{ backgroundColor: '#1f854dff' }}></span>
                  <span>Concluído</span>
                </div>
                <span className="legend-value">{metrics.concluidoPercent}%</span>
              </div>
              
              <div className="legend-item">
                <div className="legend-label">
                  <span className="legend-dot" style={{ backgroundColor: '#767B91' }}></span>
                  <span>Fazendo</span>
                </div>
                <span className="legend-value">{metrics.fazendoPercent}%</span>
              </div>

              <div className="legend-item">
                <div className="legend-label">
                  <span className="legend-dot" style={{ backgroundColor: '#1C99E0' }}></span>
                  <span>Novas Solicitações</span>
                </div>
                <span className="legend-value">{metrics.novasPercent}%</span>
              </div>
              
              <div className="legend-item">
                <div className="legend-label">
                  <span className="legend-dot" style={{ backgroundColor: '#F4D35E' }}></span>
                  <span>Pendente de aprovação</span>
                </div>
                <span className="legend-value">{metrics.pendentePercent}%</span>
              </div>

              <div className="legend-item">
                <div className="legend-label">
                  <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>
                  <span>Parado</span>
                </div>
                <span className="legend-value">{metrics.paradoPercent}%</span>
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
                  <th>Departamento</th>
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
                        {task.departamento || '-'}
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
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>
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
