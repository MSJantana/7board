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
  const normalizePathname = (pathname: string) => (pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname);
  const pathname = normalizePathname(location.pathname);

  const isActive = (path: string) => (pathname === path ? 'active' : '');

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header-mobile">
          <span className="sidebar-title">Menu</span>
          <button className="close-btn" onClick={onClose} aria-label="Fechar menu" type="button">
            <span className="material-icons" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="sidebar-toggle-desktop">
          <button
            className="toggle-btn"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            type="button"
          >
            <span className="material-icons" aria-hidden="true">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        <nav className="nav-menu">
          <div className="nav-section">
            <ul>
              <li className={isActive('/admin')}>
                <Link
                  to="/admin"
                  className="nav-link"
                  onClick={handleLinkClick}
                  aria-current={pathname === '/admin' ? 'page' : undefined}
                  title={isCollapsed ? 'Kanban' : ''}
                >
                  <span className="material-symbols-outlined icon" aria-hidden="true">
                    view_kanban
                  </span>
                  <span className="link-text">Kanban</span>
                </Link>
              </li>
              <li className={isActive('/admin/analytics')}>
                <Link
                  to="/admin/analytics"
                  className="nav-link"
                  onClick={handleLinkClick}
                  aria-current={pathname === '/admin/analytics' ? 'page' : undefined}
                  title={isCollapsed ? 'Dashboard' : ''}
                >
                  <span className="material-symbols-outlined icon" aria-hidden="true">
                    pie_chart
                  </span>
                  <span className="link-text">Dashboard</span>
                </Link>
              </li>
              <li className={isActive('/admin/solicitacoes')}>
                <Link
                  to="/admin/solicitacoes"
                  className="nav-link"
                  onClick={handleLinkClick}
                  aria-current={pathname === '/admin/solicitacoes' ? 'page' : undefined}
                  title={isCollapsed ? 'Solicitações' : ''}
                >
                  <span className="material-icons icon" aria-hidden="true">
                    list_alt
                  </span>
                  <span className="link-text">Solicitações</span>
                </Link>
              </li>
              <li className={isActive('/admin/arquivados')}>
                <Link
                  to="/admin/arquivados"
                  className="nav-link"
                  onClick={handleLinkClick}
                  aria-current={pathname === '/admin/arquivados' ? 'page' : undefined}
                  title={isCollapsed ? 'Arquivados' : ''}
                >
                  <span className="material-icons icon" aria-hidden="true">
                    archive
                  </span>
                  <span className="link-text">Arquivados</span>
                </Link>
              </li>
              <li className={isActive('/admin/usuarios')}>
                <Link
                  to="/admin/usuarios"
                  className="nav-link"
                  onClick={handleLinkClick}
                  aria-current={pathname === '/admin/usuarios' ? 'page' : undefined}
                  title={isCollapsed ? 'Usuários' : ''}
                >
                  <span className="material-icons icon" aria-hidden="true">
                    people
                  </span>
                  <span className="link-text">Usuários</span>
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

