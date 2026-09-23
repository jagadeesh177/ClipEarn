/**
 * Server-side brute-force and rate-limiting protection for sensitive security operations,
 * specifically Campaign Manager Access Code validation.
 *
 * Policy:
 * - Maximum 5 failed access-code attempts within 15 minutes per IP and user/session.
 * - Lockout for 15 minutes on violation, increasing to 1 hour on repeated abuse.
 * - Successful legitimate attempts do not count toward failed attempts.
 */

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  lockedUntil: number;
  totalViolations: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const EXTENDED_LOCKOUT_MS = 60 * 60 * 1000; // 1 hour for repeated violations

/**
 * Periodically purge stale records to maintain low memory usage
 */
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.lockedUntil && now - record.lastAttemptAt > WINDOW_MS * 2) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  cleanupTimer.unref?.();
}

/**
 * Extracts client IP address reliably from incoming request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Checks if the identifier (IP, user ID, or combined) is currently rate-limited.
 */
export function isRateLimited(identifier: string): {
  isLimited: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    return { isLimited: false, retryAfterSeconds: 0 };
  }

  // Active lockout in place
  if (now < record.lockedUntil) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.lockedUntil - now) / 1000));
    return { isLimited: true, retryAfterSeconds };
  }

  // Check if attempts within the active sliding window reached limit
  if (now - record.firstAttemptAt <= WINDOW_MS && record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.totalViolations += 1;
    const lockout = record.totalViolations > 1 ? EXTENDED_LOCKOUT_MS : BASE_LOCKOUT_MS;
    record.lockedUntil = now + lockout;
    const retryAfterSeconds = Math.ceil(lockout / 1000);
    return { isLimited: true, retryAfterSeconds };
  }

  // If previous window has elapsed, clean up stale record
  if (now - record.firstAttemptAt > WINDOW_MS && now >= record.lockedUntil) {
    rateLimitStore.delete(identifier);
    return { isLimited: false, retryAfterSeconds: 0 };
  }

  return { isLimited: false, retryAfterSeconds: 0 };
}

/**
 * Records a failed access attempt against the identifier.
 */
export function recordFailedAttempt(identifier: string): {
  isLimited: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  let record = rateLimitStore.get(identifier);

  if (!record || (now - record.firstAttemptAt > WINDOW_MS && now >= record.lockedUntil)) {
    record = {
      attempts: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      lockedUntil: 0,
      totalViolations: record?.totalViolations || 0,
    };
    rateLimitStore.set(identifier, record);
    return { isLimited: false, retryAfterSeconds: 0 };
  }

  record.attempts += 1;
  record.lastAttemptAt = now;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.totalViolations += 1;
    const lockout = record.totalViolations > 1 ? EXTENDED_LOCKOUT_MS : BASE_LOCKOUT_MS;
    record.lockedUntil = now + lockout;
    const retryAfterSeconds = Math.ceil(lockout / 1000);
    return { isLimited: true, retryAfterSeconds };
  }

  return { isLimited: false, retryAfterSeconds: 0 };
}

/**
 * Resets failed attempt counters upon successful authorization.
 */
export function recordSuccessfulAttempt(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Resets all rate limit state (primarily for automated testing).
 */
export function resetAllRateLimits(): void {
  rateLimitStore.clear();
}
