// In-memory client cache to ensure instant page navigation without flashing skeletons or page reloads
const memoryCache = new Map<string, { data: any; timestamp: number }>();

export const clientCache = {
  get<T = any>(key: string, maxAgeMs = 180_000): T | null {
    if (typeof window === "undefined") return null;
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > maxAgeMs) {
      return null;
    }
    return entry.data as T;
  },

  set(key: string, data: any) {
    if (typeof window === "undefined") return;
    memoryCache.set(key, { data, timestamp: Date.now() });
  },

  clear(key?: string) {
    if (key) {
      memoryCache.delete(key);
    } else {
      memoryCache.clear();
    }
  },
};
