import { useEffect, useState } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './SolicitacoesList.css';

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
  startedAt?: string;
  completedAt?: string;
  archivedAt?: string;
}

export function SolicitacoesList() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSolicitacoes = async () => {
    const response = await axios.get('http://localhost:3001/api/cards');
    // Ensure veiculacao is parsed correctly if needed, though mostly display string here
    return response.data.map((item: Solicitacao) => ({
      ...item,
      status: item.status === 'in-progress' ? 'fazendo' : item.status,
      veiculacao: typeof item.veiculacao === 'string' 
        ? JSON.parse(item.veiculacao) 
        : item.veiculacao
    }));
  };

  useEffect(() => {
    let isMounted = true;
    fetchSolicitacoes().then(data => {
      if (isMounted) {
        setSolicitacoes(data);
      }
    }).catch(error => {
      console.error('Error fetching solicitacoes:', error);
    });
    return () => { isMounted = false; };
  }, []);

  const handleRefresh = async () => {
    try {
      const data = await fetchSolicitacoes();
      setSolicitacoes(data);
    } catch (error) {
      console.error('Error fetching solicitacoes:', error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'Pendente';
      case 'in-progress': return 'Em Progresso';
      case 'fazendo': return 'Fazendo';
      case 'done': return 'Concluído';
      case 'archived': return 'Arquivado';
      case 'video-materiais': return 'Video/Materiais';
      case 'cobertura-eventos': return 'Cobertura de Eventos';
      case 'arte': return 'Arte';
      case 'aprovacao': return 'Aprovação';
      case 'parado': return 'Parado';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'todo': return 'status-todo';
      case 'in-progress': return 'status-in-progress';
      case 'fazendo': return 'status-fazendo';
      case 'done': return 'status-done';
      case 'archived': return 'status-archived';
      case 'video-materiais': return 'status-video-materiais';
      case 'cobertura-eventos': return 'status-cobertura-eventos';
      case 'arte': return 'status-arte';
      case 'aprovacao': return 'status-aprovacao';
      case 'parado': return 'status-parado';
      default: return '';
    }
  };

  const formatVeiculacao = (veiculacao: string[] | string) => {
    if (Array.isArray(veiculacao)) return veiculacao.join(', ');
    return veiculacao;
  };

  const filteredSolicitacoes = solicitacoes.filter(item => {
    const matchesDept = filterDept ? item.departamento === filterDept : true;
    const matchesStatus = filterStatus ? item.status === filterStatus : true;
    const matchesSearch = searchTerm 
      ? item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.protocolo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.departamento.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return matchesDept && matchesStatus && matchesSearch;
  });

  return (
    <div className="solicitacoes-list-container">
      <div className="page-header">
        <h2 className="page-title">Histórico de Solicitações</h2>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <select 
            className="filter-select" 
            value={filterDept} 
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="">Todos Departamentos</option>
            <option value="Marketing">Marketing</option>
            <option value="Vendas">Vendas</option>
            <option value="RH">RH</option>
            <option value="Financeiro">Financeiro</option>
          </select>
        </div>

        <div className="filter-group">
          <select 
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos Status</option>
            <option value="todo">Pendente</option>
            <option value="in-progress">Em Progresso</option>
            <option value="done">Concluído</option>
          </select>
        </div>

        <div className="search-box">
          <span className="material-icons search-icon">search</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar por protocolo, descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button className="action-btn btn-primary" onClick={handleRefresh}>
          <span className="material-icons">refresh</span> Atualizar
        </button>
      </div>

      <div className="table-container">
        <table className="solicitacoes-table">
          <thead>
            <tr>
              <th>Data Entrega</th>
              <th>Protocolo</th>
              <th>Departamento</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredSolicitacoes.map(item => (
              <>
                <tr 
                  key={item.id} 
                  className={`row-clickable ${expandedId === item.id ? 'row-expanded' : ''}`}
                  onClick={() => toggleExpand(item.id)}
                >
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <span className="material-icons" style={{fontSize: '18px', color: '#00d1b2'}}>event</span>
                      {format(parseISO(item.dataEntrega), "dd MMM yyyy", { locale: ptBR })}
                    </div>
                    {item.horarioEntrega && <small style={{color: '#999', marginLeft: '26px'}}>{item.horarioEntrega}</small>}
                  </td>
                  <td className="protocol-cell">{item.protocolo || '-'}</td>
                  <td><span className="dept-badge">{item.departamento}</span></td>
                  <td>{item.tipoSolicitacao}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td>
                    <span className={`material-icons expand-icon ${expandedId === item.id ? 'open' : ''}`}>
                      expand_more
                    </span>
                  </td>
                </tr>
                
                {expandedId === item.id && (
                  <tr className="expanded-row">
                    <td colSpan={6} style={{padding: 0}}>
                      <div className="expanded-row-content">
                        <div className="details-grid">
                          <div className="detail-column">
                            <h4>Detalhes da Solicitação</h4>
                            
                            <div className="detail-item">
                              <span className="detail-label">Descrição</span>
                              <div className="detail-value">{item.descricao}</div>
                            </div>

                            <div className="detail-item">
                              <span className="detail-label">Veiculação</span>
                              <div className="detail-value">{formatVeiculacao(item.veiculacao)}</div>
                            </div>
                          </div>

                          <div className="detail-column">
                            <h4>Informações de Contato</h4>
                            
                            <div className="detail-item">
                              <span className="detail-label">Solicitante</span>
                              <div className="detail-value">{item.departamento}</div>
                            </div>

                            <div className="detail-item">
                              <span className="detail-label">Email</span>
                              <div className="detail-value">{item.email || 'Não informado'}</div>
                            </div>

                            {item.arquivoUrl && (
                              <div className="detail-item">
                                <span className="detail-label">Anexo</span>
                                <div className="detail-value">
                                  <a href={`http://localhost:3001${item.arquivoUrl}`} target="_blank" rel="noopener noreferrer" className="file-link">
                                    <span className="material-icons" style={{fontSize: '16px'}}>attach_file</span>{' '}
                                    Ver Arquivo
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="detail-column">
                            <h4>Histórico / Log</h4>
                            <div className="log-timeline">
                              <div className="log-item created">
                                <div className="log-text">Solicitação Criada</div>
                                <span className="log-date">
                                  {format(parseISO(item.createdAt), "dd MMM yyyy HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                              
                              {(item.startedAt || item.status === 'in-progress' || item.status === 'done') && (
                                <div className="log-item production">
                                  <div className="log-text">Em Produção</div>
                                  <span className="log-date">
                                    {item.startedAt 
                                      ? format(parseISO(item.startedAt), "dd MMM yyyy HH:mm", { locale: ptBR })
                                      : '-'}
                                  </span>
                                </div>
                              )}

                              {(item.completedAt || item.status === 'done') && (
                                <div className="log-item done">
                                  <div className="log-text">Solicitação Concluída</div>
                                  <span className="log-date">
                                    {item.completedAt 
                                      ? format(parseISO(item.completedAt), "dd MMM yyyy HH:mm", { locale: ptBR })
                                      : '-'}
                                  </span>
                                </div>
                              )}

                              {(item.archivedAt || item.status === 'archived') && (
                                <div className="log-item done">
                                  <div className="log-text">Arquivado</div>
                                  <span className="log-date">
                                    {item.archivedAt 
                                      ? format(parseISO(item.archivedAt), "dd MMM yyyy HH:mm", { locale: ptBR })
                                      : '-'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            
            {filteredSolicitacoes.length === 0 && (
              <tr>
                <td colSpan={6} style={{textAlign: 'center', padding: '40px', color: '#888'}}>
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
