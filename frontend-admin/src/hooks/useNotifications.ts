import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatDistanceToNow, parseISO, isToday, differenceInHours, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Notification {
  id: string;
  user: string;
  avatar: string;
  action: string;
  target: string;
  time: string;
  read: boolean;
  type: 'solicitation' | 'reply' | 'follow' | 'mention' | 'file' | 'deadline';
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
  dataEntrega: string;
  horarioEntrega?: string;
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
      const response = await axios.get('/api/cards');
      const cards: Solicitacao[] = response.data;
      
      const newCards = cards.filter(card => card.status === 'todo');
      const urgentCards = cards.filter(card => 
        !['done', 'archived', 'concluido'].includes(card.status) &&
        isValid(parseISO(card.dataEntrega))
      );
      
   const readIds = getReadIds();

      const newSolicitations: Notification[] = newCards.map(card => {
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

      const deadlineNotifications: Notification[] = urgentCards.map(card => {
        const deliveryDate = parseISO(card.dataEntrega);
        const targetDate = deliveryDate;
        if (card.horarioEntrega) {
          const [h, m] = card.horarioEntrega.split(':').map(Number);
          targetDate.setHours(h || 0, m || 0, 0, 0);
        } else {
          targetDate.setHours(23, 59, 59, 999);
        }
        
        const hoursLeft = differenceInHours(targetDate, new Date());
        
        if (hoursLeft < 24 && hoursLeft > -48) { // Alert if < 24h and not overly late (e.g. 2 days ago)
           const notifId = `deadline-${card.id}`;
           const isRead = readIds.includes(notifId);
           
           return {
             id: notifId,
             cardId: card.id,
             user: 'Sistema',
             avatar: '',
             action: 'Alerta de Prazo',
             target: `Entrega em ${hoursLeft <= 0 ? 'atraso' : hoursLeft + 'h'}`,
             time: formatDistanceToNow(targetDate, { addSuffix: true, locale: ptBR }),
             read: isRead,
             type: 'deadline',
             isToday: isToday(targetDate) // Actually relates to delivery date, but useful for sorting/display
           };
        }
        return null;
      }).filter((n): n is Notification => n !== null);

      const allNotifications = [...newSolicitations, ...deadlineNotifications];
      // Sort by read status (unread first) then time (most recent first? or most urgent?)
      // For now, let's sort by creation/target time roughly.
      // But actually, unread notifications are more important.
      // Let's just sort by time logic implicitly or explicitly.
      // Since 'time' string is relative, sorting by it is hard.
      // Let's rely on array order: new solicitations first, then deadlines.
      // Or maybe sort by date object if we had it.
      
      // Let's keep it simple: new solicitations on top is good, but deadlines are urgent.
      // Maybe mix them?
      // Let's just return combined.
      
      return allNotifications;
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
    const interval = setInterval(loadData, 5000); // Poll every 5s
    
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
