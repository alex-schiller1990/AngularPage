export const LIST_CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

interface ListCacheEnvelope<T> {
  savedAt: number;
  data: T[];
}

export interface CachedList<T> {
  data: T[];
  expired: boolean;
}

export function readListFromStorage<T>(
  key: string,
  ttlMs: number = LIST_CACHE_TTL_MS
): CachedList<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return { data: parsed as T[], expired: true };
    }

    if (!isListCacheEnvelope<T>(parsed)) return null;

    const ageMs = Date.now() - parsed.savedAt;
    return {
      data: parsed.data,
      expired: ageMs > ttlMs,
    };
  } catch {
    return null;
  }
}

export function writeListToStorage<T>(key: string, data: T[]): void {
  try {
    const envelope: ListCacheEnvelope<T> = {
      savedAt: Date.now(),
      data,
    };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Ignore quota or serialization errors.
  }
}

export function removeListFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage access errors.
  }
}

function isListCacheEnvelope<T>(value: unknown): value is ListCacheEnvelope<T> {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as ListCacheEnvelope<T>;
  return (
    typeof candidate.savedAt === 'number' &&
    Number.isFinite(candidate.savedAt) &&
    Array.isArray(candidate.data)
  );
}
