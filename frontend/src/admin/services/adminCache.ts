type CacheEntry<T> = {
  value: T;
  updatedAt: number;
};

const DEFAULT_TTL_MS = 30_000;

let cardsEntry: CacheEntry<unknown[]> | null = null;
let usersEntry: CacheEntry<unknown[]> | null = null;

const isFresh = <T,>(entry: CacheEntry<T> | null, ttlMs = DEFAULT_TTL_MS): entry is CacheEntry<T> => {
  if (!entry) return false;
  return Date.now() - entry.updatedAt <= ttlMs;
};

const safeParseVeiculacao = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const normalizeCardsFromApi = (items: unknown[]) => {
  return items.map((item) => {
    const raw = item as Record<string, unknown>;
    const status = raw.status === 'in-progress' ? 'fazendo' : raw.status;
    return {
      ...raw,
      status,
      veiculacao: safeParseVeiculacao(raw.veiculacao),
    };
  });
};

export const getCachedCards = (ttlMs = DEFAULT_TTL_MS) => {
  const entry = cardsEntry;
  if (!isFresh(entry, ttlMs)) return null;
  return entry.value;
};

export const setCachedCards = (cards: unknown[]) => {
  cardsEntry = { value: cards, updatedAt: Date.now() };
};

export const getCachedUsers = (ttlMs = DEFAULT_TTL_MS) => {
  const entry = usersEntry;
  if (!isFresh(entry, ttlMs)) return null;
  return entry.value;
};

export const setCachedUsers = (users: unknown[]) => {
  usersEntry = { value: users, updatedAt: Date.now() };
};
