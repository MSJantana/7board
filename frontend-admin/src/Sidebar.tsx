import { Link, useLocation } from 'react-router-dom';
import { Logo } from './components/Logo';
import './Sidebar.css';

export function Sidebar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <aside className="sidebar">
      <div className="logo-area">
        <Logo className="sidebar-logo" />
        <span className="logo-text">SevenBoard</span>
      </div>

      <nav className="nav-menu">
        <div className="nav-section">
          <ul>
            <li className={isActive('/')}>
              <Link to="/" className="nav-link">
                <span className="material-symbols-outlined icon">dashboard_customize</span> Dashboard
              </Link>
            </li>
            <li className={isActive('/solicitacoes')}>
              <Link to="/solicitacoes" className="nav-link">
                <span className="material-icons icon">list_alt</span> Solicitações
              </Link>
            </li>
            <li className={isActive('/arquivados')}>
              <Link to="/arquivados" className="nav-link">
                <span className="material-icons icon">archive</span> Arquivados
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
