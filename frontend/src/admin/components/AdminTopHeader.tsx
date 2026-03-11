import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useNotifications, type Notification } from '../hooks/useNotifications';
import { CardDetailsModal } from './CardDetailsModal';
import './AdminTopHeader.css';

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
  status:
    | 'todo'
    | 'in-progress'
    | 'fazendo'
    | 'done'
    | 'archived'
    | 'video-materiais'
    | 'cobertura-eventos'
    | 'arte'
    | 'aprovacao'
    | 'parado';
  createdAt: string;
}

const ANIMATION_MS = 400;

function NotificationItem({
  notification,
  animating,
  onClick,
}: Readonly<{
  notification: Readonly<Notification>;
  animating: boolean;
  onClick: (id: string) => void;
}>) {
  return (
    <button
      className={`notification-item ${notification.read ? '' : 'unread'} ${animating ? 'read-animating' : ''}`}
      onClick={() => onClick(notification.id)}
      aria-label={`Marcar notificação de ${notification.user} como lida`}
      type="button"
    >
      <div className="user-avatar-placeholder">
        <span className="material-icons" aria-hidden="true">
          assignment
        </span>
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

export function AdminTopHeader({ onMenuClick }: Readonly<{ onMenuClick?: () => void }>) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, markAllAsRead, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'previous'>('today');
  const [animatingIds, setAnimatingIds] = useState<string[]>([]);
  const [selectedCard, setSelectedCard] = useState<Solicitacao | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const userInitials = (() => {
    const name = user?.name?.trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? 'U';
    const last = parts.length > 1 ? parts.at(-1)?.[0] ?? '' : '';
    return `${first}${last}`.toUpperCase();
  })();

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const todayNotifications = notifications.filter((n) => n.isToday);
  const previousNotifications = notifications.filter((n) => !n.isToday);

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleMarkAllRead = () => {
    const idsToAnimate = notifications.filter((n) => !n.read).map((n) => n.id);
    if (idsToAnimate.length > 0) {
      setAnimatingIds(idsToAnimate);
      globalThis.setTimeout(() => setAnimatingIds([]), ANIMATION_MS);
    }
    markAllAsRead();
  };

  const handleClearAll = () => {
    markAllAsRead();
    setShowNotifications(false);
  };

  const fetchCardById = useCallback(async (id: string) => {
    const response = await axios.get(`/api/cards/${id}`);
    return response.data;
  }, []);

  const removeAnimatingId = (id: string) => {
    setAnimatingIds((prev) => prev.filter((x) => x !== id));
  };

  const handleNotificationClick = useCallback(async (id: string, cardId?: string) => {
    setAnimatingIds((prev) => [...prev, id]);
    globalThis.setTimeout(() => removeAnimatingId(id), ANIMATION_MS);
    markAsRead(id);

    if (cardId) {
      try {
        const cardData = await fetchCardById(cardId);
        if (typeof cardData.veiculacao === 'string') {
          try {
            cardData.veiculacao = JSON.parse(cardData.veiculacao);
          } catch {
            cardData.veiculacao = [];
          }
        }
        setSelectedCard(cardData);
      } catch (error) {
        console.error('Error fetching card details:', error);
        toast.error('Erro ao carregar detalhes da solicitação.');
      }
    }
  }, [fetchCardById, markAsRead]);

  const filteredNotifications = activeTab === 'today' ? todayNotifications : previousNotifications;

  return (
    <header className="top-system-header">
        <div className="system-left">
          <button className="menu-btn" onClick={onMenuClick} aria-label="Abrir menu" type="button">
            <span className="material-icons" aria-hidden="true">
              menu
            </span>
          </button>
          <div className="system-logo-area">
            <img src="/logo-midia-flow.png" alt="Logo Mídia Flow" className="system-logo-img" />
          </div>
        </div>
        <div className="system-right">
          <div className="notification-wrapper" ref={dropdownRef}>
            <button
              className={`system-icon-btn ${unreadCount > 0 ? 'has-unread animate-bell' : ''}`}
              onClick={toggleNotifications}
              aria-label={unreadCount > 0 ? `${unreadCount} novas notificações` : 'Notificações'}
              aria-expanded={showNotifications}
              aria-haspopup="true"
              type="button"
            >
              {unreadCount > 0 ? (
                <span className="material-symbols-outlined" aria-hidden="true">
                  notification_important
                </span>
              ) : (
                <span className="material-icons" aria-hidden="true">
                  notifications
                </span>
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
                    <button className="mark-read-btn" onClick={handleMarkAllRead} type="button">
                      <span className="material-icons" aria-hidden="true">
                        done_all
                      </span>
                      <span>Marcar como lidas</span>
                    </button>
                    <button className="clear-all-btn" onClick={handleClearAll} type="button">
                      <span>limpar todas</span>
                    </button>
                  </div>
                </div>

                <div className="dropdown-tabs" role="tablist">
                  <button
                    className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
                    onClick={() => setActiveTab('today')}
                    role="tab"
                    aria-selected={activeTab === 'today'}
                    aria-controls="notification-list"
                    type="button"
                  >
                    Hoje <span className="tab-count">{todayNotifications.length}</span>
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'previous' ? 'active' : ''}`}
                    onClick={() => setActiveTab('previous')}
                    role="tab"
                    aria-selected={activeTab === 'previous'}
                    aria-controls="notification-list"
                    type="button"
                  >
                    Anteriores <span className="tab-count">{previousNotifications.length}</span>
                  </button>
                </div>

                <div className="notification-list" id="notification-list" role="tabpanel">
                  {filteredNotifications.length === 0 ? (
                    <div className="empty-state">Nenhuma notificação</div>
                  ) : (
                    filteredNotifications.map((n) => (
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
              onClick={() => setShowUserDropdown((prev) => !prev)}
              aria-label="Menu de usuário"
              aria-haspopup="true"
              aria-expanded={showUserDropdown}
              type="button"
            >
              <div className="user-avatar-badge" aria-hidden="true">
                {userInitials}
              </div>
              <span className="user-name-display">{user?.name ?? 'Usuário'}</span>
              <span className={`material-icons user-trigger-chevron ${showUserDropdown ? 'open' : ''}`} aria-hidden="true">
                expand_more
              </span>
            </button>

            {showUserDropdown && (
              <div className="user-dropdown-menu" role="menu">
                {user && (
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-avatar" aria-hidden="true">
                      <span className="material-icons">person</span>
                    </div>
                    <div className="user-dropdown-header-content">
                      <div className="user-name-text">{user.name}</div>
                      <div className="user-email-text">{user.email}</div>
                    </div>
                  </div>
                )}
                {user && <div className="user-dropdown-divider" />}
                {user ? (
                  <button
                    className="user-dropdown-item danger"
                    role="menuitem"
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                      navigate('/solicitacoes', { replace: true });
                    }}
                    type="button"
                  >
                    <span className="material-icons" aria-hidden="true">
                      logout
                    </span>
                    <span className="user-dropdown-label">Sair</span>
                  </button>
                ) : (
                  <button
                    className="user-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/login');
                    }}
                    type="button"
                  >
                    <span className="material-icons" aria-hidden="true">
                      login
                    </span>
                    <span className="user-dropdown-label">Login</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {selectedCard && (
            <CardDetailsModal
              card={selectedCard}
              onClose={() => setSelectedCard(null)}
              onStatusChange={async (id, status) => {
                try {
                  await axios.put(`/api/cards/${id}/status`, { status });
                  toast.success('Status atualizado!');
                  setSelectedCard((prev) => (prev ? { ...prev, status: status as Solicitacao['status'] } : null));
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
