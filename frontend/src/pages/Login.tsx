import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const API_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { token, user } = response.data;
      login(token, user);
      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Falha ao realizar login';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.error || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-shell">
        <div className="login-left" aria-hidden="true">
          <div className="login-left-content">
            <div className="login-left-title">Mídia Flow</div>            
            <div className="login-left-text">
              Acesse sua conta para gerenciar solicitações e acompanhar atualizações.
            </div>
          </div>
        </div>

        <div className="login-right">
          <h2 className="login-title">Sign in</h2>
          <p className="login-subtitle">Insira seus dados para continuar.</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <span className="material-icons field-icon" aria-hidden="true">person</span>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <span className="material-icons field-icon" aria-hidden="true">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="field-action"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                disabled={loading}
              >
                <span className="material-icons" aria-hidden="true">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <div className="login-row">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>Lembrar-me</span>
              </label>
              {/* <button type="button" className="link-btn" disabled>
                Esqueceu a senha?
              </button> */}
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Entrando...' : 'Sign in'}
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate('/solicitacoes')}
              disabled={loading}
            >
              Cancelar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
