export function readListFromStorage<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

export function writeListToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
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
