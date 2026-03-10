import { useEffect, useState } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ToastContainer, toast } from 'react-toastify';
import './UsuariosList.css';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

const initialFormData: UserFormData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user'
};

export function UsuariosList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email' && emailError) {
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError('Por favor, insira um endereço de e-mail válido.');
      showValidationToast('Por favor, insira um endereço de e-mail válido.');
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      showValidationToast('As senhas informadas não conferem. Por favor, verifique.');
    }
  };

  const handleAdd = () => {
    setCurrentUser(null);
    setFormData(initialFormData);
    setEmailError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Password is not populated for security
      confirmPassword: '',
      role: user.role
    });
    setEmailError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsModalOpen(true);
  };

  const executeDelete = async (id: string) => {
    try {
      await axios.delete(`/api/users/${id}`);
      toast.success('Usuário apagado com sucesso!');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário.');
    }
  };

  const handleDelete = (id: string) => {
    toast.warn(
      ({ closeToast }) => (
        <div>
          <p style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '14px', fontWeight: 'bold' }}>Tem certeza que deseja excluir?</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                executeDelete(id);
                closeToast();
              }}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              Excluir
            </button>
            <button
              onClick={closeToast}
              style={{
                background: '#e2e8f0',
                color: '#1e293b',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        containerId: 'usuarios-delete',
        position: "top-right",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        icon: false,
        style: { marginTop: '96px' }
      }
    );
  };

  const showValidationToast = (message: string) => {
    console.log('Exibindo toast de validação:', message);
    toast.error(message, {
      position: "top-center",
      autoClose: 4000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      style: {
        background: '#ffffff',
        color: '#1f2937',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        borderRadius: '8px',
        padding: '12px',
        border: '1px solid #e5e7eb',
        fontWeight: 500
      },
      icon: (
        <div style={{
          backgroundColor: '#f97316',
          color: 'white',
          minWidth: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '14px',
          lineHeight: '1'
        }}>!</div>
      )
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      showValidationToast('Por favor, insira o e-mail.');
      return;
    }

    if (!validateEmail(formData.email)) {
      setEmailError('Por favor, insira um endereço de e-mail válido.');
      showValidationToast('Por favor, insira um endereço de e-mail válido.');
      return;
    }

    if (!formData.name) {
      showValidationToast('Por favor, insira o nome de usuário.');
      return;
    }

    if (!currentUser && !formData.password) {
      showValidationToast('Por favor, insira a senha.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showValidationToast('As senhas informadas não conferem. Por favor, verifique.');
      return;
    }

    const dataToSend: Partial<UserFormData> = { ...formData };
    delete dataToSend.confirmPassword;

    try {
      if (currentUser) {
        if (!dataToSend.password) {
          delete dataToSend.password;
        }
        await axios.put(`/api/users/${currentUser.id}`, dataToSend);
        toast.success('Usuário editado com sucesso!');
      } else {
        await axios.post('/api/users', dataToSend);
        toast.success('Usuário criado com sucesso!');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Erro ao salvar usuário.');
    }
  };

  if (loading) {
    return <div className="loading-container">Carregando...</div>;
  }

  return (
    <div className="usuarios-list-container">
      <div className="page-header" style={{ justifyContent: 'flex-end' }}>
        <button className="btn-add" onClick={handleAdd}>Adicionar Usuário</button>
      </div>

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Função</th>
              <th>Data de Criação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  {format(parseISO(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon btn-edit" onClick={() => handleEdit(user)} title="Editar">
                      <span className="material-icons">edit</span>
                    </button>
                    <button className="btn-icon btn-delete" onClick={() => handleDelete(user.id)} title="Excluir">
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="no-data">Nenhum usuário encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ToastContainer
        containerId="usuarios-delete"
        position="top-right"
        autoClose={false}
        closeOnClick={false}
        draggable={false}
        pauseOnHover
        newestOnTop
        hideProgressBar
        closeButton={false}
        theme="light"
        style={{ zIndex: 999999, marginTop: '96px' }}
      />

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{currentUser ? 'Editar Usuário' : 'Adicionar Usuário'}</h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group icon-input-group">
                <span className="material-icons input-icon">email</span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="E-mail"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleEmailBlur}
                  className={emailError ? 'error' : ''}
                />
              </div>

              <div className="form-group icon-input-group">
                <span className="material-icons input-icon">person</span>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Username"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group icon-input-group">
                <span className="material-icons input-icon">lock</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={currentUser ? 'Password (leave blank to keep current)' : 'Password'}
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-icons">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              <div className="form-group icon-input-group">
                <span className="material-icons input-icon">lock_outline</span>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleConfirmPasswordBlur}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-icons">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              <div className="form-group icon-input-group">
                <span className="material-icons input-icon">admin_panel_settings</span>
                <select id="role" name="role" value={formData.role} onChange={handleInputChange}>
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
