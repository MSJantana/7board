import { useEffect, useState } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './SolicitacoesList.css';
import { Pagination } from './components/Pagination';

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
  status: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  archivedAt?: string;
}

export function ArquivadosList() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getDateValue = (item: Solicitacao) => {
    if (item.archivedAt) return new Date(item.archivedAt).getTime();
    if (item.completedAt) return new Date(item.completedAt).getTime();
    return 0;
  };

  const fetchSolicitacoes = async () => {
    const response = await axios.get('/api/cards');
    // Ensure veiculacao is parsed correctly if needed, though mostly display string here
    return response.data.map((item: Solicitacao) => ({
      ...item,
      veiculacao: typeof item.veiculacao === 'string' 
        ? JSON.parse(item.veiculacao) 
        : item.veiculacao
    }));
  };

  useEffect(() => {
    let isMounted = true;
    fetchSolicitacoes().then(data => {
      if (isMounted) {
        // Filter only archived items
        const archived = data.filter((item: Solicitacao) => item.status === 'archived');
        // Sort by archivedAt descending, fallback to completedAt
        const sorted = archived.sort((a: Solicitacao, b: Solicitacao) => {
          const dateA = getDateValue(a);
          const dateB = getDateValue(b);
          return dateB - dateA;
        });
        setSolicitacoes(sorted);
      }
    }).catch(error => {
      console.error('Error fetching solicitacoes:', error);
    });
    return () => { isMounted = false; };
  }, []);

  const handleRefresh = async () => {
    try {
      const data = await fetchSolicitacoes();
      const archived = data.filter((item: Solicitacao) => item.status === 'archived');
      const sorted = archived.sort((a: Solicitacao, b: Solicitacao) => {
          const dateA = getDateValue(a);
          const dateB = getDateValue(b);
          return dateB - dateA;
        });
      setSolicitacoes(sorted);
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
      case 'done': return 'Concluído';
      case 'archived': return 'Arquivado';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'todo': return 'status-todo';
      case 'in-progress': return 'status-in-progress';
      case 'done': return 'status-done';
      case 'archived': return 'status-done'; // Reuse done style or add specific
      default: return '';
    }
  };

  const formatVeiculacao = (veiculacao: string[] | string) => {
    if (Array.isArray(veiculacao)) return veiculacao.join(', ');
    return veiculacao;
  };

  const filteredSolicitacoes = solicitacoes.filter(item => {
    const matchesDept = filterDept ? item.departamento === filterDept : true;
    const matchesSearch = searchTerm 
      ? item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.protocolo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.departamento.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return matchesDept && matchesSearch;
  });

  const totalPages = Math.ceil(filteredSolicitacoes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredSolicitacoes.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="solicitacoes-list-container">
      <div className="filters-bar">
        <div className="filter-group">
          <select 
            className="filter-select" 
            value={filterDept} 
            onChange={(e) => { setFilterDept(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Todos Departamentos</option>
            <option value="Educação">Educação</option>
            <option value="Evangelismo/MG">Evangelismo/MG</option>
            <option value="IntegraRH">IntegraRH</option>
            <option value="JA/Com/Mus/Univ/MAP">JA/Com/Mus/Univ/MAP</option>
            <option value="MCA">MCA</option>
            <option value="MDA">MDA</option>
            <option value="Ministerial e Família">Ministerial e Família</option>
            <option value="MIPES/Esc. Sabatina/ASA">MIPES/Esc. Sabatina/ASA</option>
            <option value="Mordomia e Saúde">Mordomia e Saúde</option>
            <option value="Mulher/AFAM">Mulher/AFAM</option>
            <option value="Nutrição">Nutrição</option>
            <option value="Publicações/EP">Publicações/EP</option>
            <option value="Secretaria">Secretaria</option>
            <option value="Tesouraria">Tesouraria</option>
            <option value="Outros">Outros (Especificar na observação)</option>               
          </select>
        </div>

        <div className="search-box">
          <span className="material-icons search-icon">search</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar por protocolo, descrição..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
              <th>Data Arquivamento</th>
              <th>Protocolo</th>
              <th>Departamento</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(item => (
              <>
                <tr 
                  key={item.id}  
                  className={`row-clickable ${expandedId === item.id ? 'row-expanded' : ''}`}
                  onClick={() => toggleExpand(item.id)}
                >
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <span className="material-icons" style={{fontSize: '18px', color: '#64748b'}}>archive</span>
                      {item.completedAt 
                        ? format(parseISO(item.completedAt), "dd MMM yyyy", { locale: ptBR })
                        : 'Data N/A'}
                    </div>
                    {item.completedAt && <small style={{color: '#999', marginLeft: '26px'}}>
                       {format(parseISO(item.completedAt), "HH:mm")}
                    </small>}
                  </td>
                  <td className="protocol-cell">{item.protocolo || '-'}</td>
                  <td><span className="dept-badge">{item.departamento}</span></td>
                  <td>{item.tipoSolicitacao}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(item.status)}`} style={{backgroundColor: '#64748b', color: 'white'}}>
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
                                  <a href={`${item.arquivoUrl}`} target="_blank" rel="noopener noreferrer" className="file-link">
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
                              
                              {(item.startedAt) && (
                                <div className="log-item production">
                                  <div className="log-text">Fazendo</div>
                                  <span className="log-date">
                                    {format(parseISO(item.startedAt), "dd MMM yyyy HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
                              )}

                              {(item.completedAt) && (
                                <div className="log-item done">
                                  <div className="log-text">Concluído</div>
                                  <span className="log-date">
                                    {format(parseISO(item.completedAt), "dd MMM yyyy HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
                              )}

                              {(item.archivedAt) && (
                                <div className="log-item done">
                                  <div className="log-text">Arquivado</div>
                                  <span className="log-date">
                                    {format(parseISO(item.archivedAt), "dd MMM yyyy HH:mm", { locale: ptBR })}
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
            
            {currentItems.length === 0 && (
              <tr>
                <td colSpan={6} style={{textAlign: 'center', padding: '40px', color: '#888'}}>
                  Nenhum item arquivado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredSolicitacoes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredSolicitacoes.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
