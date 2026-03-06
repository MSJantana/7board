import './TopHeader.css';

export function TopHeader({ onMenuClick }: Readonly<{ onMenuClick?: () => void }>) {
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
       <div className="user-avatar-small">
            <span className="material-icons">person</span>
      </div>
      </div>
        
    </header>
  );
}
