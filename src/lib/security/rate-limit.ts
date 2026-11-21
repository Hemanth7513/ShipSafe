import { NextRequest } from 'next/server';

/**
 * Sliding-window rate limiter per client IP with automatic memory cleanup.
 * Enforces abuse limits for live scans while allowing uninhibited access to /demo-target.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipStore = new Map<string, RateLimitEntry>();

const MAX_SCANS_PER_WINDOW = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour sliding window
const MAX_TRACKED_IPS = 10_000; // Hard cap on memory to prevent memory exhaustion DoS
let lastPrunedAt = 0;
const PRUNE_INTERVAL_MS = 60 * 1000; // Prune at most once per minute

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Prunes expired entries from the IP store to prevent memory leaks.
 */
export function pruneExpiredEntries(now = Date.now()): number {
  let pruned = 0;
  for (const [ip, entry] of ipStore.entries()) {
    if (now > entry.resetAt) {
      ipStore.delete(ip);
      pruned++;
    }
  }
  lastPrunedAt = now;
  return pruned;
}

/**
 * Resets the in-memory rate limit store (useful for automated testing).
 */
export function resetRateLimits(): void {
  ipStore.clear();
  lastPrunedAt = 0;
}

/**
 * Returns the current number of tracked IP records.
 */
export function getTrackedIpCount(): number {
  return ipStore.size;
}

/**
 * Checks whether an IP address is within its permitted scan quota.
 */
export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();

  // Periodically prune expired entries or if store exceeds threshold
  if (now - lastPrunedAt > PRUNE_INTERVAL_MS || ipStore.size >= MAX_TRACKED_IPS) {
    pruneExpiredEntries(now);

    // If still over hard cap after pruning expired records, drop oldest entries
    if (ipStore.size >= MAX_TRACKED_IPS) {
      const keysToDelete = Array.from(ipStore.keys()).slice(0, Math.floor(MAX_TRACKED_IPS * 0.2));
      for (const k of keysToDelete) {
        ipStore.delete(k);
      }
    }
  }

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

/**
 * Safely extracts client IP address, prioritizing trusted edge headers
 * before falling back to X-Forwarded-For or localhost.
 */
export function getClientIp(req: NextRequest): string {
  // 1. Cloudflare connecting IP
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) return cfIp.trim();

  // 2. Standard X-Real-IP set by trusted reverse proxies (Nginx / Vercel / AWS ALB)
  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();

  // 3. NextRequest direct IP property if provided by platform runtime
  const directIp = (req as unknown as { ip?: string }).ip;
  if (directIp && directIp.trim()) return directIp.trim();

  // 4. X-Forwarded-For: take first non-empty IP
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const clientCandidate = xForwardedFor.split(',')[0]?.trim();
    if (clientCandidate) return clientCandidate;
  }

  return '127.0.0.1';
}
