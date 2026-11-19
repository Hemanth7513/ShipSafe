/**
 * In-memory sliding-window rate limiter per client IP.
 * Enforces abuse limits for live scans while allowing uninhibited access to /demo-target.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipStore = new Map<string, RateLimitEntry>();

const MAX_SCANS_PER_WINDOW = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour sliding window

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks whether an IP address is within its permitted scan quota.
 */
export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const entry = ipStore.get(ip);

  // If no entry exists or window expired, reset
  if (!entry || now > entry.resetAt) {
    ipStore.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: MAX_SCANS_PER_WINDOW - 1,
      resetInSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  // If exceeded limit
  if (entry.count >= MAX_SCANS_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  // Increment count
  entry.count += 1;
  return {
    allowed: true,
    remaining: MAX_SCANS_PER_WINDOW - entry.count,
    resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}
