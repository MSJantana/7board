import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatDistanceToNow, parseISO, isToday, differenceInHours, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Stage } from '../services/stageUtils';

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
  createdAt: string;
  deliveryAt: string;
  archivedAt?: string | null;
  stageId: string;
  stage?: Stage | null;
}

const STORAGE_KEY = 'sevenboard_read_notifications';

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

  const fetchNotificationsData = useCallback(async () => {
    try {
      const response = await axios.get('/api/cards');
      const cards: Solicitacao[] = response.data;

      const activeCards = cards.filter((card) => !card.archivedAt);
      const newCards = activeCards.filter(
        (card) => (card.stage?.kind ?? 'TODO') === 'TODO' || card.stage?.name === 'Novas solicitações'
      );
      const urgentCards = activeCards.filter((card) => {
        if (!card.deliveryAt) return false;
        const d = parseISO(card.deliveryAt);
        if (!isValid(d)) return false;
        if (card.stage?.kind === 'DONE' || card.stage?.name === 'Concluído') return false;
        return true;
      });

      const readIds = getReadIds();

      const newSolicitations: Notification[] = newCards.map((card) => {
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
          isToday: isToday(createdDate),
        };
      });

      const deadlineNotifications: Notification[] = urgentCards
        .map((card) => {
          const targetDate = parseISO(card.deliveryAt);
          const hoursLeft = differenceInHours(targetDate, new Date());

          if (hoursLeft < 24 && hoursLeft > -48) {
            const notifId = `deadline-${card.id}`;
            const isRead = readIds.includes(notifId);
            const deliveryText = hoursLeft <= 0 ? 'atraso' : `${hoursLeft}h`;

            return {
              id: notifId,
              cardId: card.id,
              user: 'Sistema',
              avatar: '',
              action: 'Alerta de Prazo',
              target: `Entrega em ${deliveryText}`,
              time: formatDistanceToNow(targetDate, { addSuffix: true, locale: ptBR }),
              read: isRead,
              type: 'deadline',
              isToday: isToday(targetDate),
            };
          }
          return null;
        })
        .filter((n): n is Notification => n !== null);

      return [...newSolicitations, ...deadlineNotifications];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }, []);

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
    const interval = setInterval(loadData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchNotificationsData]);

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
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const currentReadIds = getReadIds();
    const newReadIds = Array.from(new Set([...currentReadIds, ...allIds]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newReadIds));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
