import { useEffect, useState, Fragment } from 'react';
import axios from 'axios';
import { format, parseISO, parse, isValid, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './SolicitacoesList.css';
import { Pagination } from './components/Pagination';
import { getCachedCards, normalizeCardsFromApi, setCachedCards } from './services/adminCache';

interface Stage {
  id: string;
  name: string;
  order: number;
  kind?: 'TODO' | 'IN_PROGRESS' | 'VALIDATION' | 'DONE';
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
  stageId: string;
  stage?: Stage | null;
  observacoes?: string;
  arquivoUrl?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  archivedAt?: string;
}

const getStageClass = (stageName: string) => {
  switch (stageName) {
    case 'Novas solicitações':
      return 'status-todo';
    case 'Videos/Matérias':
      return 'status-video-materiais';
    case 'Cobertura de Eventos':
      return 'status-cobertura-eventos';
    case 'Arte':
      return 'status-arte';
    case 'Fazendo':
      return 'status-fazendo';
    case 'A Aprovar':
      return 'status-aprovacao';
    case 'Parado':
      return 'status-parado';
    case 'Concluído':
      return 'status-done';
    default:
      return '';
  }
};

const parseLogDate = (value: string): Date | null => {
  const cleaned = value.replace(',', '').trim();
  const patterns = ['dd/MM/yyyy HH:mm:ss', 'dd/MM/yyyy HH:mm', 'dd MMM yyyy HH:mm'];

  for (const pattern of patterns) {
    const d = parse(cleaned, pattern, new Date());
    if (isValid(d)) return d;
  }
  return null;
};

export function SolicitacoesList() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>(() => (getCachedCards() as Solicitacao[]) ?? []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterStageId, setFilterStageId] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [stages, setStages] = useState<Stage[]>([]);

  const fetchSolicitacoes = async () => {
    const response = await axios.get('/api/cards');
    const normalized = normalizeCardsFromApi(response.data as unknown[]);
    setCachedCards(normalized);
    return normalized as Solicitacao[];
  };

  const fetchStages = async () => {
    const response = await axios.get('/api/stages', { params: { boardKey: 'default', active: true } });
    return response.data as Stage[];
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchSolicitacoes(), fetchStages()])
      .then(([data, stageData]) => {
        if (isMounted) {
          setSolicitacoes(data);
          setStages(stageData);
        }
      })
      .catch((error) => {
        console.error('Error fetching solicitacoes:', error);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = () => {
    globalThis.location.reload();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatVeiculacao = (veiculacao: string[] | string) => {
    if (Array.isArray(veiculacao)) return veiculacao.join(', ');
    return veiculacao;
  };

  const filteredSolicitacoes = solicitacoes.filter((item) => {
    if (item.archivedAt) return false;
    const matchesDept = filterDept ? item.departamento === filterDept : true;
    const effectiveStageId = item.stageId ?? '';
    const matchesStage = filterStageId ? effectiveStageId === filterStageId : true;
    const matchesSearch = search
      ? item.descricao.toLowerCase().includes(search.toLowerCase()) ||
        item.protocolo?.toLowerCase().includes(search.toLowerCase()) ||
        item.departamento.toLowerCase().includes(search.toLowerCase())
      : true;

    return matchesDept && matchesStage && matchesSearch;
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
          <select className="filter-select" value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setCurrentPage(1); }}>
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

        <div className="filter-group">
          <select className="filter-select" value={filterStageId} onChange={(e) => { setFilterStageId(e.target.value); setCurrentPage(1); }}>
            <option value="">Todos Status</option>
            {stages
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>

        <div className="search-box">
          <span className="material-icons search-icon" aria-hidden="true">
            search
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por protocolo, descrição..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            aria-label="Buscar solicitações"
          />
        </div>

        <button className="action-btn btn-primary" onClick={handleRefresh} aria-label="Atualizar lista" type="button">
          <span className="material-icons" aria-hidden="true">
            refresh
          </span>{' '}
          Atualizar
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
            {currentItems.map((item) => {
              const deliveryDate = parseISO(item.deliveryAt);
              let hoursLeft = 1000;
              if (isValid(deliveryDate)) {
                const targetDate = deliveryDate;
                hoursLeft = differenceInHours(targetDate, new Date());
              }
              const isUrgent = hoursLeft < 24 && !item.archivedAt && item.stage?.name !== 'Concluído';
              const statusLabel = item.stage?.name ?? '-';

              return (
                <Fragment key={item.id}>
                  <tr
                    className={`row-clickable ${expandedId === item.id ? 'row-expanded' : ''}`}
                    onClick={() => toggleExpand(item.id)}
                    tabIndex={0}
                    aria-expanded={expandedId === item.id}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpand(item.id);
                      }
                    }}
                  >
                    <td data-label="Data Entrega">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className="material-icons"
                          style={{ fontSize: '18px', color: isUrgent ? '#e74c3c' : '#00d1b2' }}
                          aria-hidden="true"
                        >
                          event
                        </span>
                        <span style={{ color: isUrgent ? '#e74c3c' : 'inherit', fontWeight: isUrgent ? 'bold' : 'normal' }}>
                          {format(parseISO(item.deliveryAt), 'dd MMM yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <small style={{ color: '#999', marginLeft: '26px' }}>{format(parseISO(item.deliveryAt), 'HH:mm')}</small>
                    </td>
                    <td className="protocol-cell" data-label="Protocolo">
                      {item.protocolo || '-'}
                    </td>
                    <td data-label="Departamento">
                      <span className="dept-badge">{item.departamento}</span>
                    </td>
                    <td data-label="Tipo">{item.tipoSolicitacao}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${getStageClass(statusLabel)}`}>{statusLabel}</span>
                    </td>
                    <td data-label="Ações">
                      <span className={`material-icons expand-icon ${expandedId === item.id ? 'open' : ''}`}>expand_more</span>
                    </td>
                  </tr>

                  {expandedId === item.id && (
                    <tr className="expanded-row">
                      <td colSpan={6} style={{ padding: 0 }}>
                        <div className="expanded-row-content">
                          <div className="details-grid">
                            <div className="detail-column">
                              <h4>Detalhes da Solicitação</h4>

                              <div className="detail-item">
                                <span className="detail-label">Descrição</span>
                                <div className="detail-value">{item.descricao}</div>
                              </div>

                              {item.observacoes &&
                                (() => {
                                  const userNotes = item.observacoes
                                    .split('\n')
                                    .filter((l) => !l.trim().startsWith('['))
                                    .join('\n');
                                  return userNotes ? (
                                    <div className="detail-item">
                                      <span className="detail-label">Observações</span>
                                      <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                                        {userNotes}
                                      </div>
                                    </div>
                                  ) : null;
                                })()}

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
                                      <span className="material-icons" style={{ fontSize: '16px' }}>
                                        attach_file
                                      </span>{' '}
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
                                  <span className="log-date">{format(parseISO(item.createdAt), 'dd MMM yyyy HH:mm', { locale: ptBR })}</span>
                                </div>

                                {item.observacoes?.split('\n').map((line, index) => {
                                  const trimmed = line.trim();
                                  if (!trimmed.startsWith('[')) return null;
                                  const key = `${index}-${trimmed}`;
                                  const closeBracket = trimmed.indexOf(']');
                                  if (closeBracket <= 1) return null;
                                  const rawDate = trimmed.substring(1, closeBracket).trim();
                                  const msg = trimmed.substring(closeBracket + 1).trim();
                                  const parsedDate = parseLogDate(rawDate);
                                  const displayDate = parsedDate ? format(parsedDate, 'dd MMM yyyy HH:mm', { locale: ptBR }) : rawDate;

                                  const statusPrefix = 'Status alterado:';
                                  if (msg.startsWith(statusPrefix)) {
                                    const arrowIdx = msg.indexOf('→');
                                    const fromTo = msg.replace(statusPrefix, '').trim();
                                    let toLabel = '';
                                    if (arrowIdx !== -1) {
                                      toLabel = fromTo.substring(arrowIdx + 1).trim();
                                    }

                                    const cls = (() => {
                                      const lower = toLabel.toLowerCase();
                                      if (lower.includes('pendente') || lower.includes('pendentes')) return 'reopened';
                                      if (lower.includes('fazendo')) return 'production';
                                      if (lower.includes('concluído')) return 'done';
                                      if (lower.includes('arquivado')) return 'done';
                                      return 'production';
                                    })();
                                    const displayText = (() => {
                                      const lower = toLabel.toLowerCase();
                                      if (lower.includes('pendente') || lower.includes('pendentes')) return 'Solicitação reaberta.';
                                      if (lower.includes('fazendo')) return 'Fazendo';
                                      if (lower.includes('concluído')) return 'Solicitação Concluída';
                                      if (lower.includes('arquivado')) return 'Arquivado';
                                      return toLabel;
                                    })();

                                    return (
                                      <div key={key} className={`log-item ${cls}`}>
                                        <div className="log-text">{displayText}</div>
                                        <span className="log-date">{displayDate}</span>
                                      </div>
                                    );
                                  }

                                  const lowerMsg = msg.toLowerCase();
                                  if (lowerMsg.startsWith('etapa alterada')) {
                                    const arrowIdx = msg.indexOf('→');
                                    const toLabel = arrowIdx !== -1 ? msg.substring(arrowIdx + 1).trim() : msg;
                                    const cls = (() => {
                                      const lower = toLabel.toLowerCase();
                                      if (lower.includes('conclu')) return 'done';
                                      if (lower.includes('novas')) return 'reopened';
                                      if (lower.includes('arquiv')) return 'done';
                                      return 'production';
                                    })();

                                    return (
                                      <div key={key} className={`log-item ${cls}`}>
                                        <div className="log-text">{msg}</div>
                                        <span className="log-date">{displayDate}</span>
                                      </div>
                                    );
                                  }
                                  if (lowerMsg.includes('reaberta')) {
                                    return (
                                      <div key={key} className="log-item reopened">
                                        <div className="log-text">{msg}</div>
                                        <span className="log-date">{displayDate}</span>
                                      </div>
                                    );
                                  }
                                  if (lowerMsg.includes('fazendo')) {
                                    return (
                                      <div key={key} className="log-item production">
                                        <div className="log-text">{msg}</div>
                                        <span className="log-date">{displayDate}</span>
                                      </div>
                                    );
                                  }
                                  if (lowerMsg.includes('em produção')) {
                                    return (
                                      <div key={key} className="log-item production">
                                        <div className="log-text">Fazendo</div>
                                        <span className="log-date">{displayDate}</span>
                                      </div>
                                    );
                                  }
                                  if (lowerMsg.includes('solicitação concluída')) {
                                    return (
                                      <div key={key} className="log-item done">
                                        <div className="log-text">{msg}</div>
                                        <span className="log-date">{displayDate}</span>
                                      </div>
                                    );
                                  }
                                  if (lowerMsg.includes('arquivado')) {
                                    return (
                                      <div key={key} className="log-item done">
                                        <div className="log-text">{msg}</div>
                                        <span className="log-date">{displayDate}</span>
                                      </div>
                                    );
                                  }

                                  return null;
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {currentItems.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredSolicitacoes.length > 0 && (
        <Pagination currentPage={currentPage} totalItems={filteredSolicitacoes.length} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />
      )}
    </div>
  );
}
