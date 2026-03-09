import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';
import { CardDetailsModal } from './CardDetailsModal';
import './TopHeader.css';

interface Solicitacao {
  id: string;
  departamento: string;
  email?: string;
  protocolo?: string;
  tipoSolicitacao: string;
  descricao: string;
  veiculacao: string[] | string;
  dataEntrega: string;
  horarioEntrega?: string;
  observacoes?: string;
  arquivoUrl?: string;
  status: 'todo' | 'in-progress' | 'fazendo' | 'done' | 'archived' | 'video-materiais' | 'cobertura-eventos' | 'arte' | 'aprovacao' | 'parado';
  createdAt: string;
}

type Notification = {
  id: string;
  read: boolean;
  user: string;
  action: string;
  target?: string;
  time: string;
  cardId?: string;
};

const ANIMATION_MS = 400;

type NotificationItemProps = Readonly<{
  notification: Readonly<Notification>;
  animating: boolean;
  onClick: (id: string) => void;
}>;

function NotificationItem({
  notification,
  animating,
  onClick,
}: NotificationItemProps) {
  return (
    <button
      key={notification.id}
      className={`notification-item ${notification.read ? '' : 'unread'} ${animating ? 'read-animating' : ''}`}
      onClick={() => onClick(notification.id)}
      aria-label={`Marcar notificação de ${notification.user} como lida`}
    >
      <div className="user-avatar-placeholder">
        <span className="material-icons">assignment</span>
      </div>
      <div className="notification-content">
        <div className="notification-header-row">
          <p className="notification-text">
            <span className="user-name">{notification.user}</span>
            <span className="action-text">{notification.action}</span>
            {notification.target && <span className="target-text">{notification.target}</span>}
            {!notification.read && <span className="unread-dot">●</span>}
          </p>
          <span className="notification-time">{notification.time}</span>
        </div>
      </div>
    </button>
  );
}

export function TopHeader({ onMenuClick }: Readonly<{ onMenuClick?: () => void }>) {
  const { user, logout } = useAuth();
  const { notifications, markAllAsRead, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'previous'>('today');
  const notificationRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [animatingIds, setAnimatingIds] = useState<string[]>([]);
  const [selectedCard, setSelectedCard] = useState<Solicitacao | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const todayNotifications = notifications.filter(n => n.isToday);
  const previousNotifications = notifications.filter(n => !n.isToday);

  const onDocumentMouseDown = useCallback((event: MouseEvent) => {
    if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
      setShowNotifications(false);
    }
    if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
      setShowUserDropdown(false);
    }
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowNotifications(false);
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

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  const handleMarkAllRead = () => {
    const idsToAnimate = notifications.filter(n => !n.read).map(n => n.id);
    if (idsToAnimate.length > 0) {
      setAnimatingIds(idsToAnimate);
      setTimeout(() => setAnimatingIds([]), ANIMATION_MS);
    }
    markAllAsRead();
  };

  const handleClearAll = () => {
    markAllAsRead();
    setShowNotifications(false);
  };

  const removeAnimatingId = (id: string) => {
    setAnimatingIds(prev => prev.filter(x => x !== id));
  };

  const handleNotificationClick = async (id: string, cardId?: string) => {
    setAnimatingIds(prev => [...prev, id]);
    setTimeout(() => removeAnimatingId(id), ANIMATION_MS);
    markAsRead(id);

    if (cardId) {
      try {
        const response = await axios.get(`/api/cards/${cardId}`);
        const cardData = response.data;
        // Parse veiculacao if needed, similar to Dashboard logic
        if (typeof cardData.veiculacao === 'string') {
            try {
                cardData.veiculacao = JSON.parse(cardData.veiculacao);
            } catch {
                // ignore
            }
        }
        setSelectedCard(cardData);
      } catch (error) {
        console.error('Error fetching card details:', error);
        toast.error('Erro ao carregar detalhes da solicitação.');
      }
    }
  };

  const setTabToday = () => setActiveTab('today');
  const setTabPrevious = () => setActiveTab('previous');

  const filteredNotifications = activeTab === 'today' 
    ? todayNotifications 
    : previousNotifications;

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
        <div className="notification-wrapper" ref={notificationRef}>
          <button 
            className={`system-icon-btn ${unreadCount > 0 ? 'has-unread animate-bell' : ''}`}
            onClick={toggleNotifications}
            aria-label={unreadCount > 0 ? `${unreadCount} novas notificações` : "Notificações"}
            aria-expanded={showNotifications}
            aria-haspopup="true"
          >
            {unreadCount > 0 ? (
              <span className="material-symbols-outlined" aria-hidden="true">notification_important</span>
            ) : (
              <span className="material-icons" aria-hidden="true">notifications</span>
            )}
            {unreadCount > 0 && (
              <span className="system-notification-badge" aria-hidden="true">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="system-notification-dropdown">
              <div className="dropdown-header">
                <h3>Notificações</h3>
                <div className="dropdown-header-actions">
                  <button className="mark-read-btn" onClick={handleMarkAllRead}>
                    <span className="material-icons" aria-hidden="true">done_all</span> Marcar como lidas
                  </button>
                  <button className="clear-all-btn" onClick={handleClearAll}>
                    limpar todas
                  </button>
                </div>
              </div>

              <div className="dropdown-tabs" role="tablist">
                <button 
                  className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
                  onClick={setTabToday}
                  role="tab"
                  aria-selected={activeTab === 'today'}
                  aria-controls="notification-list"
                >
                  Hoje <span className="tab-count">{todayNotifications.length}</span>
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'previous' ? 'active' : ''}`}
                  onClick={setTabPrevious}
                  role="tab"
                  aria-selected={activeTab === 'previous'}
                  aria-controls="notification-list"
                >
                  Anteriores <span className="tab-count">{previousNotifications.length}</span>
                </button>
              </div>

              <div className="notification-list" id="notification-list" role="tabpanel">
                {filteredNotifications.length === 0 ? (
                  <div className="empty-state">Nenhuma notificação</div>
                ) : (
                  filteredNotifications.map(n => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      animating={animatingIds.includes(n.id)}
                      onClick={(id) => handleNotificationClick(id, n.cardId)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-menu-wrapper" ref={userDropdownRef}>
          <button 
            className="user-info" 
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            aria-label="Menu de usuário"
            aria-haspopup="true"
            aria-expanded={showUserDropdown}
          >
            <span className="user-name-display">{user ? user.name : 'Usuário'}</span>
            <div className="user-avatar-small" title="Perfil">
              <span className="material-icons">person</span>
            </div>
          </button>

          {showUserDropdown && (
            <div className="user-dropdown-menu" role="menu">
              <div className="user-dropdown-header-content">
                <div className="user-name-text">{user ? user.name : 'Usuário'}</div>
                <div className="user-email-text">{user ? user.email : ''}</div>
              </div>
              <div className="user-dropdown-divider"></div>
              <button className="user-dropdown-item" role="menuitem" onClick={logout}>
                <span className="material-icons">logout</span> Sair
              </button>
            </div>
          )}
        </div>

        {selectedCard && (
          <CardDetailsModal
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            onStatusChange={async (id, status) => {
               // Update status via API
               try {
                 await axios.put(`/api/cards/${id}/status`, { status });
                 toast.success('Status atualizado!');
                 // Update local state to reflect change immediately in modal if needed
                 setSelectedCard(prev => prev ? { ...prev, status: status as Solicitacao['status'] } : null);
               } catch (error) {
                 console.error('Error updating status:', error);
                 toast.error('Erro ao atualizar status.');
               }
            }}
          />
        )}
      </div>
    </header>
  );
}
