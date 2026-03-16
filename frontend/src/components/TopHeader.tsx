import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './TopHeader.css';

export function TopHeader({ onMenuClick }: Readonly<{ onMenuClick?: () => void }>) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const onDocumentMouseDown = useCallback((event: MouseEvent) => {
    if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
      setShowUserDropdown(false);
    }
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowUserDropdown(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', onDocumentMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocumentMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onDocumentMouseDown, onKeyDown]);

  return (
    <header className="top-system-header">
      <div className="system-left">
        <button 
          className="menu-btn" 
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <span className="material-icons">menu</span>
        </button>
        <div className="system-logo-area">
          <img 
            src="/logo-midia-flow.png" 
            alt="Logo Mídia Flow" 
            className="system-logo-img" 
          />
        </div>
      </div>
      <div className="system-right">
        <div className="user-menu-wrapper" ref={userDropdownRef}>
          <button 
            className="user-info" 
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            aria-label="Menu de usuário"
            aria-haspopup="true"
            aria-expanded={showUserDropdown}
          >
            <div className="user-avatar-small" title="Perfil">
              <span className="material-icons">person</span>
            </div>
          </button>

          {showUserDropdown && (
            <div className="user-dropdown-menu" role="menu">
              {user && (
                <div className="user-dropdown-header-content">
                  <div className="user-name-text">{user.name}</div>
                  <div className="user-email-text">{user.email}</div>
                </div>
              )}
              {user && <div className="user-dropdown-divider"></div>}
              {user ? (
                <>
                  <button
                    className="user-dropdown-item"
                    role="menuitem"
                    onClick={() => navigate('/admin')}
                  >
                    <span className="material-icons">dashboard</span> Ir ao Dashboard
                  </button>
                  <div className="user-dropdown-divider"></div>
                </>
              ) : null}
              {user ? (
                <button className="user-dropdown-item" role="menuitem" onClick={logout}>
                  <span className="material-icons">logout</span> Sair
                </button>
              ) : (
                <button className="user-dropdown-item" role="menuitem" onClick={() => navigate('/login')}>
                  <span className="material-icons">login</span> Login
                </button>
              )}
            </div>
          )}
        </div>
      </div>
        
    </header>
  );
}
