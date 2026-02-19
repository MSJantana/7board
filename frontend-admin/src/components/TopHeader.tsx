import { useState, useEffect, useRef } from 'react';
import { Logo } from './Logo';
import { useNotifications } from '../hooks/useNotifications';
import './TopHeader.css';

export function TopHeader() {
  const { notifications, markAllAsRead, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'previous'>('today');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [animatingIds, setAnimatingIds] = useState<string[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const todayNotifications = notifications.filter(n => n.isToday);
  const previousNotifications = notifications.filter(n => !n.isToday);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    const idsToAnimate = notifications.filter(n => !n.read).map(n => n.id);
    if (idsToAnimate.length > 0) {
      setAnimatingIds(idsToAnimate);
      setTimeout(() => setAnimatingIds([]), 400);
    }
    markAllAsRead();
  };

  const handleClearAll = () => {
    markAllAsRead();
    setShowNotifications(false);
  };

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
            onClick={() => setShowNotifications(!showNotifications)}
          >
            {unreadCount > 0 ? (
              <span className="material-symbols-outlined">notification_important</span>
            ) : (
              <span className="material-icons">notifications</span>
            )}
            {unreadCount > 0 && <span className="system-notification-badge" />}
          </button>

          {showNotifications && (
            <div className="system-notification-dropdown">
              <div className="dropdown-header">
                <h3>Notificações</h3>
                <div className="dropdown-header-actions">
                  <button className="mark-read-btn" onClick={handleMarkAllRead}>
                    <span className="material-icons">done_all</span> Marcar como lidas
                  </button>
                  <button className="clear-all-btn" onClick={handleClearAll}>
                    limpar todas
                  </button>
                </div>
              </div>

              <div className="dropdown-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
                  onClick={() => setActiveTab('today')}
                >
                  Hoje
                  <span className="tab-count">{todayNotifications.length}</span>
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'previous' ? 'active' : ''}`}
                  onClick={() => setActiveTab('previous')}
                >
                  Anteriores
                  <span className="tab-count">{previousNotifications.length}</span>
                </button>
              </div>

              <div className="notification-list">
                {filteredNotifications.length === 0 ? (
                  <div className="empty-state">Nenhuma notificação</div>
                ) : (
                  filteredNotifications.map(notification => (
                    <button 
                      key={notification.id} 
                      className={`notification-item ${notification.read ? '' : 'unread'} ${animatingIds.includes(notification.id) ? 'read-animating' : ''}`}
                      onClick={() => {
                        setAnimatingIds(prev => [...prev, notification.id]);
                        setTimeout(() => {
                          setAnimatingIds(prev => prev.filter(id => id !== notification.id));
                        }, 400);
                        markAsRead(notification.id);
                      }}
                      aria-label={`Marcar notificação de ${notification.user} como lida`}
                    >
                      <div className="user-avatar-placeholder">
                        <span className="material-icons">assignment</span>
                      </div>
                      <div className="notification-content">
                        <div className="notification-header-row">
                          <p className="notification-text">
                            <span className="user-name">{notification.user}</span>
                            {' '}{notification.action}{' '}
                            {notification.target && <span className="target-text">{notification.target}</span>}
                            {!notification.read && <span className="unread-dot">●</span>}
                          </p>
                          <span className="notification-time">{notification.time}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-info">
          <span className="user-email">joao.ferreira@exemplo.uk.org</span>
          <div className="user-avatar-small">
            <span className="material-icons" style={{fontSize: '20px', color: '#666'}}>person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
