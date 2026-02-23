import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Logo7B } from './components/Logo7B';
import { ASRSLogo } from './components/ASRSLogo';
import './SolicitacaoForm.css';

const TIPOS_SOLICITACAO = [
  'Arte para Instagram/Whatsapp (5 dias)',
  'Cobertura de Eventos (20 dias)',
  'Assessoria de Imprensa/Matérias (20 dias)',
  'Vídeo (30 dias)',
  'Identidade visual completa para eventos (30 dias)',
  'Transmissão de Live (30 dias)',
  'Arquivos digitais como boletim informativo (30 dias)',
  'Arquivos como pulseiras, camisetas (10 dias)'
];

const OPCOES_VEICULACAO = [
  'Digital',
  'Impresso' 
];

export function SolicitacaoForm() {
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    departamento: '',
    email: '',
    tipoSolicitacao: '',
    descricao: '',
    veiculacao: [] as string[],
    dataEntrega: '',
    horarioEntrega: '',
    observacoes: ''
  });
  const [arquivo, setArquivo] = useState<File | null>(null);

  useEffect(() => {
    document.title = 'Solicitações';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFormData({
          departamento: '',
          email: '',
          tipoSolicitacao: '',
          descricao: '',
          veiculacao: [],
          dataEntrega: '',
          horarioEntrega: '',
          observacoes: ''
        });
        setArquivo(null);
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);

    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-fill time if date is selected and time is empty
      if (name === 'dataEntrega' && value && !prev.horarioEntrega) {
        newData.horarioEntrega = getCurrentTime();
      }
      
      return newData;
    });
  };

  const handleCheckboxChange = (option: string) => {
    setFormData(prev => {
      const current = prev.veiculacao;
      const updated = current.includes(option)
        ? current.filter(item => item !== option)
        : [...current, option];
      return { ...prev, veiculacao: updated };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArquivo(e.target.files[0]);
    }
  };

  const toggleAllVeiculacao = () => {
    setFormData(prev => ({
      ...prev,
      veiculacao: prev.veiculacao.length === OPCOES_VEICULACAO.length ? [] : [...OPCOES_VEICULACAO]
    }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    const today = new Date().toISOString().split('T')[0];
    if (formData.dataEntrega && formData.dataEntrega < today) {
      toast.error('Data Inválida: a data de entrega não pode ser anterior à data de hoje.');
      return;
    }
    
    const data = new FormData();
    data.append('departamento', formData.departamento);
    data.append('email', formData.email);
    data.append('tipoSolicitacao', formData.tipoSolicitacao);
    data.append('descricao', formData.descricao);
    data.append('dataEntrega', formData.dataEntrega);
    data.append('horarioEntrega', formData.horarioEntrega);
    data.append('observacoes', formData.observacoes);
    // Enviar array como string JSON para simplificar parse no backend (ou append múltiplo)
    data.append('veiculacao', JSON.stringify(formData.veiculacao));
    
    if (arquivo) {
      data.append('arquivo', arquivo);
    }

    axios.post('/api/cards', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(() => {
        setFormData({
          departamento: '',
          email: '',
          tipoSolicitacao: '',
          descricao: '',
          veiculacao: [],
          dataEntrega: '',
          horarioEntrega: '',
          observacoes: ''
        });
        setArquivo(null);
        toast.success('Solicitação enviada com sucesso!');
        // navigate('/'); // Removido redirecionamento para permitir novas solicitações
      })
      .catch((error) => {
        console.error('Error creating solicitacao:', error);
        toast.error('Erro ao enviar solicitação');
      });
  };

  return (
    <div className="solicitacao-container">
      <div className="sidebar-info">
        <div className="sidebar-logo"><ASRSLogo /></div>
        <div className="logo-placeholder">ASRS</div>
        <h2>Solicitações de Marketing - Midia ASRS</h2>
        <p>Utilize este formulário para abrir solicitações para a equipe de marketing!</p>
      </div>
      
      <div className="form-content">
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="form-grid">
            {/* Coluna Esquerda */}
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="departamento">
                  <span className="material-symbols-rounded">apartment</span>{' '}
                  Departamento
                </label>
                <p className="helper-text">Selecione abaixo o departamento.</p>
                <select 
                  id="departamento"
                  name="departamento" 
                  value={formData.departamento} 
                  onChange={handleInputChange} 
                  required
                  className="form-control"
                >
                  <option value="">Escolha uma opção</option>
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

              <div className="form-group">
                <label htmlFor="email">
                  <span className="material-symbols-rounded">mail</span>{' '}
                  Email do Solicitante
                </label>
                <p className="helper-text">Seu email para receber confirmação.</p>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                  placeholder="seu.nome@exemplo.com"
                />
              </div>

              <div className="form-group">
                <div className="group-label">
                  <span className="material-symbols-rounded">category</span>{' '}
                  Tipo de solicitação e prazos (peça com antecedência)
                </div>
                <p className="helper-text">Selecione o tipo de serviço que você precisa:</p>
                <div className="radio-group">
                  {TIPOS_SOLICITACAO.map(tipo => (
                    <div key={tipo} className="radio-item">
                      <input
                        type="radio"
                        id={tipo}
                        name="tipoSolicitacao"
                        value={tipo}
                        checked={formData.tipoSolicitacao === tipo}
                        onChange={handleInputChange}
                        required
                      />
                      <label htmlFor={tipo}>{tipo}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <div className="group-label">
                  <span className="material-symbols-rounded">share</span>{' '}
                  Onde irá veicular
                </div>
                <p className="helper-text">Onde essa mídia será publicada/utilizada?</p>
                <div className="checkbox-group">
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="marcar-todos"
                      checked={formData.veiculacao.length === OPCOES_VEICULACAO.length}
                      onChange={toggleAllVeiculacao}
                    />
                    <label htmlFor="marcar-todos">Marcar todos</label>
                  </div>
                  {OPCOES_VEICULACAO.map(option => (
                    <div key={option} className="checkbox-item">
                      <input
                        type="checkbox"
                        id={option}
                        checked={formData.veiculacao.includes(option)}
                        onChange={() => handleCheckboxChange(option)}
                      />
                      <label htmlFor={option}>{option}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="descricao">
                  <span className="material-symbols-rounded">description</span>{' '}
                  Descreva a sua solicitação
                </label>
                <p className="helper-text">Descreva o máximo possível.</p>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Digite aqui ..."
                  required
                  className="form-control"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>
                  <span className="material-symbols-rounded">event</span>{' '}
                  Data e Hora de Entrega
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="date"
                    name="dataEntrega"
                    value={formData.dataEntrega}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="form-control"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="time"
                    name="horarioEntrega"
                    value={formData.horarioEntrega}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="anexo">
                  <span className="material-symbols-rounded">attach_file</span>{' '}
                  Anexos
                </label>
                <div className="file-upload-wrapper">
                  <div className="file-upload-placeholder">
                    <span className="plus-icon">+</span> {arquivo ? arquivo.name : 'Adicionar anexo'}
                  </div>
                  <input 
                    id="anexo"
                    type="file" 
                    onChange={handleFileChange} 
                    accept="image/*,.pdf,.doc,.docx"
                  />
                </div>
                <p className="helper-text" style={{ marginTop: '8px' }}>Formatos: Imagens, PDF, Word - Envio Max 50MB</p>
              </div>

              <div className="form-group">
                <label htmlFor="observacoes">
                  <span className="material-symbols-rounded">chat_bubble</span>{' '}
                  Observações
                </label>
                <p className="helper-text">Mais alguma observação?</p>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  placeholder="Digite aqui ..."
                  className="form-control"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-btn">
                <span className="material-symbols-rounded" style={{ marginRight: '8px', fontSize: '18px' }}>send</span>{' '}
                Enviar Solicitação
              </button>
              <p className="security-notice">
                Nunca envie senhas ou dados confidenciais por meio de formulários desconhecidos. Certifique-se de que este formulário foi gerado por sua empresa ou por uma empresa confiável.
              </p>
            </div>
          </div>
        </form>
      </div>
      <div className="logo-7b-wrapper">
        <Logo7B />
      </div>
    </div>
  );
}
