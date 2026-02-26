import { useState, useEffect, useRef, useCallback } from 'react';
import { Logo } from './Logo';
import { useNotifications } from '../hooks/useNotifications';
import './TopHeader.css';

type Notification = {
  id: string;
  read: boolean;
  user: string;
  action: string;
  target?: string;
  time: string;
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

export function TopHeader() {
  const { notifications, markAllAsRead, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'previous'>('today');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [animatingIds, setAnimatingIds] = useState<string[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const todayNotifications = notifications.filter(n => n.isToday);
  const previousNotifications = notifications.filter(n => !n.isToday);

  const onDocumentMouseDown = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowNotifications(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', onDocumentMouseDown);
    return () => document.removeEventListener('mousedown', onDocumentMouseDown);
  }, [onDocumentMouseDown]);

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

  const handleNotificationClick = (id: string) => {
    setAnimatingIds(prev => [...prev, id]);
    setTimeout(() => removeAnimatingId(id), ANIMATION_MS);
    markAsRead(id);
  };

  const setTabToday = () => setActiveTab('today');
  const setTabPrevious = () => setActiveTab('previous');

  const filteredNotifications = activeTab === 'today' 
    ? todayNotifications 
    : previousNotifications;

  return (
    <header className="top-system-header">
      <div className="system-left">
        <div className="system-logo-area">
          <Logo className="system-logo-img" />
          <span className="system-logo-text">Board</span>
        </div>
      </div>
      <div className="system-right">
        <div className="notification-wrapper" ref={dropdownRef}>
          <button 
            className={`system-icon-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
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
                      onClick={handleNotificationClick}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/*
        <div className="user-info">
          <span className="user-email">joao.ferreira@exemplo.uk.org</span>
          <div className="user-avatar-small">
            <span className="material-icons" style={{fontSize: '20px', color: '#666'}}>person</span>
          </div>
        </div>
        */}
      </div>
    </header>
  );
}
