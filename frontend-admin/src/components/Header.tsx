import { useLocation } from 'react-router-dom';
import './Header.css';

export function Header() {
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/': return 'Dashboard';
      case '/solicitacoes': return 'Solicitações';
      case '/arquivados': return 'Arquivados';
      case '/usuarios': return 'Usuários';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="page-title">{getPageTitle(location.pathname)}</h1>
      </div>
    </header>
  );
}
