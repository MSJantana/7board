import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
  readonly isCollapsed?: boolean;
  readonly toggleCollapse?: () => void;
}

export function Sidebar({ isOpen, onClose, isCollapsed = false, toggleCollapse }: SidebarProps) {
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
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header-mobile">
          <span className="sidebar-title">Menu</span>
          <button className="close-btn" onClick={onClose} aria-label="Fechar menu">
            <span className="material-icons">close</span>
          </button>
        </div>
        
        {/* Toggle Button for Desktop */}
        <div className="sidebar-toggle-desktop">
          <button 
            className="toggle-btn" 
            onClick={toggleCollapse} 
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            <span className="material-icons">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        <nav className="nav-menu">
        <div className="nav-section">
          <ul>
            <li className={isActive('/')}>
              <Link to="/" className="nav-link" onClick={handleLinkClick} aria-current={location.pathname === '/' ? 'page' : undefined} title={isCollapsed ? "Dashboard" : ""}>
                <span className="material-symbols-outlined icon" aria-hidden="true">dashboard_customize</span> 
                <span className="link-text">Dashboard</span>
              </Link>
            </li>
            <li className={isActive('/solicitacoes')}>
              <Link to="/solicitacoes" className="nav-link" onClick={handleLinkClick} aria-current={location.pathname === '/solicitacoes' ? 'page' : undefined} title={isCollapsed ? "Solicitações" : ""}>
                <span className="material-icons icon" aria-hidden="true">list_alt</span> 
                <span className="link-text">Solicitações</span>
              </Link>
            </li>
            <li className={isActive('/arquivados')}>
              <Link to="/arquivados" className="nav-link" onClick={handleLinkClick} aria-current={location.pathname === '/arquivados' ? 'page' : undefined} title={isCollapsed ? "Arquivados" : ""}>
                <span className="material-icons icon" aria-hidden="true">archive</span> 
                <span className="link-text">Arquivados</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      
      <div className="sidebar-footer">
        <span className="footer-text">ASRS - Associação Sul do Rio Grande do Sul - 2026</span>
      </div>
    </aside>
    </>
  );
}
