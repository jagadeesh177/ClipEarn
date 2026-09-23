// High-performance client cache with sessionStorage fallback to ensure instant 0ms page navigation and reload resilience
const memoryCache = new Map<string, { data: any; timestamp: number }>();

export const clientCache = {
  get<T = any>(key: string, maxAgeMs = 300_000): T | null {
    if (typeof window === "undefined") return null;
    const entry = memoryCache.get(key);
    if (entry) {
      if (Date.now() - entry.timestamp <= maxAgeMs) {
        return entry.data as T;
      }
      memoryCache.delete(key);
    }

    try {
      const raw = sessionStorage.getItem(`ce_cache_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp <= maxAgeMs) {
          memoryCache.set(key, parsed);
          return parsed.data as T;
        }
        sessionStorage.removeItem(`ce_cache_${key}`);
      }
    } catch {}

    return null;
  },

  set(key: string, data: any) {
    if (typeof window === "undefined") return;
    const entry = { data, timestamp: Date.now() };
    memoryCache.set(key, entry);
    try {
      sessionStorage.setItem(`ce_cache_${key}`, JSON.stringify(entry));
    } catch {}
  },

  clear(key?: string) {
    if (typeof window === "undefined") return;
    if (key) {
      memoryCache.delete(key);
      try {
        sessionStorage.removeItem(`ce_cache_${key}`);
      } catch {}
    } else {
      memoryCache.clear();
      try {
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith("ce_cache_")) sessionStorage.removeItem(k);
        });
      } catch {}
    }
  },
};
