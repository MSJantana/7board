import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatDistanceToNow, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Notification {
  id: string;
  user: string;
  avatar: string;
  action: string;
  target: string;
  time: string;
  read: boolean;
  type: 'solicitation' | 'reply' | 'follow' | 'mention' | 'file';
  cardId: string;
  isToday: boolean;
}

interface Solicitacao {
  id: string;
  departamento: string;
  email?: string;
  tipoSolicitacao: string;
  descricao: string;
  status: string;
  createdAt: string;
}

const STORAGE_KEY = 'sevenboard_read_notifications';

// Helper to read from local storage
const getReadIds = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Pure data fetching function - DOES NOT set state
  const fetchNotificationsData = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/cards');
      const cards: Solicitacao[] = response.data;
      
      const newCards = cards.filter(card => card.status === 'todo');
      
      newCards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const readIds = getReadIds();

      const mappedNotifications: Notification[] = newCards.map(card => {
        const isRead = readIds.includes(card.id);
        const createdDate = parseISO(card.createdAt);
        
        return {
          id: card.id,
          cardId: card.id,
          user: card.departamento,
          avatar: '',
          action: 'criou uma nova solicitação',
          target: card.tipoSolicitacao,
          time: formatDistanceToNow(createdDate, { addSuffix: true, locale: ptBR }),
          read: isRead,
          type: 'solicitation',
          isToday: isToday(createdDate)
        };
      });

      return mappedNotifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }, []);

  // Effect handles lifecycle and state updates
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const data = await fetchNotificationsData();
      if (isMounted) {
        setNotifications(data);
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000); // Poll every 10s
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchNotificationsData]);

  // Public refresh function
  const refresh = useCallback(async () => {
    const data = await fetchNotificationsData();
    setNotifications(data);
    setLoading(false);
  }, [fetchNotificationsData]);

  const markAsRead = (id: string) => {
    const readIds = getReadIds();
    if (!readIds.includes(id)) {
      const newReadIds = [...readIds, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newReadIds));
      
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const currentReadIds = getReadIds();
    const newReadIds = Array.from(new Set([...currentReadIds, ...allIds]));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newReadIds));
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    refresh
  };
}
