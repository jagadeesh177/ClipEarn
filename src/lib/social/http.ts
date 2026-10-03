/**
 * Shared HTTP helpers for social providers: browser-like headers, timeouts,
 * placeholder-credential detection and safe integer parsing.
 */

export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": BROWSER_USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

/**
 * Returns true when an env value / token is missing or is an obvious placeholder
 * (e.g. "your_google_api_key") or a dev-mode mock token.
 */
export function isPlaceholder(value?: string | null): boolean {
  if (!value) return true;
  const v = value.trim();
  if (!v) return true;
  return (
    v.startsWith("your_") ||
    v.startsWith("mock_") ||
    v.startsWith("yt_token_") ||
    v === "optional_secure_cron_secret"
  );
}

/** Returns the first env var among `names` that holds a real (non-placeholder) value. */
export function getEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const v = process.env[name];
    if (!isPlaceholder(v)) return v!.trim();
  }
  return undefined;
}

/** Parses counts like 1234, "1234" or "1,234" into an integer; returns null when not a valid count. */
export function toCount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseInt(String(value).replace(/[,\s]/g, ""), 10);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

export async function fetchText(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<{ ok: boolean; status: number; url: string; text: string }> {
  const { timeoutMs = 8000, headers, ...rest } = init;
  const res = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
    ...rest,
    headers: { ...BROWSER_HEADERS, ...(headers as Record<string, string> | undefined) },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, url: res.url || url, text };
}

export async function fetchJson<T = any>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const { timeoutMs = 8000, ...rest } = init;
  const res = await fetch(url, { cache: "no-store", ...rest, signal: AbortSignal.timeout(timeoutMs) });
  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}
