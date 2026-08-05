/**
 * Per-IP rate limiting for /api/check.
 *
 * The endpoint is unauthenticated and every miss costs a paid API call, so an
 * unprotected public deployment is a standing invitation to run up a bill.
 *
 * Sliding window rather than fixed buckets: a fixed window lets someone fire
 * 2× the limit across a boundary, and — worse for a demo — it can hand a judge
 * a rejection one second into a fresh minute for requests they made in the
 * previous one.
 *
 * Limits are set so a judge cannot realistically hit them. Checking the three
 * examples plus a few of their own messages is ~6 requests; cache hits do not
 * count at all (see `shouldCount` in the route), so re-running an example is
 * free. You have to be trying to hit 12.
 */

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 12);

/** Hard ceiling across all callers — the cost circuit-breaker. */
const GLOBAL_MAX_PER_WINDOW = Number(process.env.RATE_LIMIT_GLOBAL_MAX || 240);

interface Bucket {
  /** Timestamps of counted requests inside the current window. */
  hits: number[];
}

const buckets = new Map<string, Bucket>();
let globalHits: number[] = [];

/** Stops the map growing without bound on a long-lived instance. */
const MAX_TRACKED_CLIENTS = 5_000;

export interface RateLimitResult {
  allowed: boolean;
  /** Requests left in the current window. */
  remaining: number;
  /** Seconds until the caller may retry. Only meaningful when blocked. */
  retryAfterSeconds: number;
  limit: number;
  /** True when the global ceiling tripped rather than the per-IP one. */
  global: boolean;
}

function prune(times: number[], now: number): number[] {
  const cutoff = now - WINDOW_MS;
  // Timestamps are appended in order, so the first in-window index is the split.
  let i = 0;
  while (i < times.length && times[i]! <= cutoff) i++;
  return i === 0 ? times : times.slice(i);
}

/**
 * Record a request and report whether it is allowed.
 *
 * Call this only for requests that will actually do paid work — see the route,
 * which checks the cache first so repeat demo checks never consume quota.
 */
export function consume(clientId: string, now = Date.now()): RateLimitResult {
  globalHits = prune(globalHits, now);
  if (globalHits.length >= GLOBAL_MAX_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: retryAfter(globalHits, now),
      limit: GLOBAL_MAX_PER_WINDOW,
      global: true,
    };
  }

  let bucket = buckets.get(clientId);
  if (!bucket) {
    if (buckets.size >= MAX_TRACKED_CLIENTS) {
      // Drop the oldest tracked client. Insertion-ordered, and anything this
      // stale is well outside the window anyway.
      const oldest = buckets.keys().next().value;
      if (oldest !== undefined) buckets.delete(oldest);
    }
    bucket = { hits: [] };
    buckets.set(clientId, bucket);
  }

  bucket.hits = prune(bucket.hits, now);

  if (bucket.hits.length >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: retryAfter(bucket.hits, now),
      limit: MAX_REQUESTS,
      global: false,
    };
  }

  bucket.hits.push(now);
  globalHits.push(now);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - bucket.hits.length,
    retryAfterSeconds: 0,
    limit: MAX_REQUESTS,
    global: false,
  };
}

function retryAfter(times: number[], now: number): number {
  const oldest = times[0];
  if (oldest === undefined) return 1;
  return Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
}

/**
 * Best-effort client identity.
 *
 * Behind Vercel/Railway the socket address is the proxy, so the forwarded
 * header is the real client. Only the first entry is trusted — the rest are
 * attacker-controllable. Spoofable in principle; adequate for a cost guard on
 * a demo, and noted as such in DECISIONS.md.
 */
export function clientIdFrom(headers: Record<string, unknown>, socketIp?: string): string {
  const forwarded = headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof raw === 'string' && raw.trim()) {
    const first = raw.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
  return socketIp || 'unknown';
}

export function rateLimitConfig() {
  return {
    window_ms: WINDOW_MS,
    max_per_ip: MAX_REQUESTS,
    global_max: GLOBAL_MAX_PER_WINDOW,
  };
}

/** Test hook. */
export function rateLimitReset(): void {
  buckets.clear();
  globalHits = [];
}
