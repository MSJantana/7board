import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header-mobile">
          <span className="sidebar-title">Menu</span>
          <button className="close-btn" onClick={onClose} aria-label="Fechar menu">
            <span className="material-icons">close</span>
          </button>
        </div>
        <nav className="nav-menu">
        <div className="nav-section">
          <ul>
            <li className={isActive('/')}>
              <Link to="/" className="nav-link" onClick={handleLinkClick} aria-current={location.pathname === '/' ? 'page' : undefined}>
                <span className="material-symbols-outlined icon" aria-hidden="true">dashboard_customize</span> Dashboard
              </Link>
            </li>
            <li className={isActive('/solicitacoes')}>
              <Link to="/solicitacoes" className="nav-link" onClick={handleLinkClick} aria-current={location.pathname === '/solicitacoes' ? 'page' : undefined}>
                <span className="material-icons icon" aria-hidden="true">list_alt</span> Solicitações
              </Link>
            </li>
            <li className={isActive('/arquivados')}>
              <Link to="/arquivados" className="nav-link" onClick={handleLinkClick} aria-current={location.pathname === '/arquivados' ? 'page' : undefined}>
                <span className="material-icons icon" aria-hidden="true">archive</span> Arquivados
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      
      <div className="sidebar-footer">
        ASRS - Associação Sul do Rio Grande do Sul - 2026
      </div>
    </aside>
    </>
  );
}
