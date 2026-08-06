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
 * examples plus a few of their own messages is ~6 requests. Cache hits are
 * metered separately and far more loosely (see CACHED_MAX_REQUESTS), so
 * re-running an example never eats into the allowance for real checks.
 */

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 12);

/** Hard ceiling across all callers — the cost circuit-breaker. */
const GLOBAL_MAX_PER_WINDOW = Number(process.env.RATE_LIMIT_GLOBAL_MAX || 240);

/**
 * Ceiling for cache hits, which cost nothing but are still function
 * invocations. Deliberately far above anything a human demo produces, so
 * "re-checking a message you've already checked is free" stays true, while an
 * unbounded replay of one cached message is not.
 */
const CACHED_MAX_REQUESTS = Number(process.env.RATE_LIMIT_CACHED_MAX || 200);

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

export interface ConsumeOptions {
  /** Override the per-client ceiling. Defaults to the paid-work limit. */
  limit?: number;
  /**
   * Whether this request counts toward the global cost ceiling. False for
   * cache hits, which cost nothing — they still need a bound (see the route)
   * but must not crowd out requests that would actually reach the API.
   */
  countGlobal?: boolean;
}

/**
 * Record a request and report whether it is allowed.
 *
 * The route calls this twice with different budgets: a tight one for requests
 * that will hit the paid API, and a loose one for cache hits, which are cheap
 * but must not be replayable without limit.
 */
export function consume(
  clientId: string,
  now = Date.now(),
  options: ConsumeOptions = {}
): RateLimitResult {
  const { limit = MAX_REQUESTS, countGlobal = true } = options;

  globalHits = prune(globalHits, now);
  if (countGlobal && globalHits.length >= GLOBAL_MAX_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: retryAfter(globalHits, now),
      limit: GLOBAL_MAX_PER_WINDOW,
      global: true,
    };
  }

  // Each budget gets its OWN bucket, not just its own ceiling. Sharing one
  // array meant free cache hits spent the paid allowance: one billable check
  // plus eleven re-checks of that same text filled the 12-slot bucket, and the
  // next new message was refused — while the refusal text said re-checking is
  // always free. The budget class has to be part of the key.
  const key = countGlobal ? clientId : `cached:${clientId}`;

  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= MAX_TRACKED_CLIENTS) {
      const oldest = buckets.keys().next().value;
      if (oldest !== undefined) buckets.delete(oldest);
    }
    bucket = { hits: [] };
  } else {
    // Re-insert so the eviction above drops the least *recently seen* client.
    // Map preserves insertion order, which is not the same as recency unless
    // we refresh it here — without this, an actively-limited client that was
    // seen first is the first one evicted, releasing its limit.
    buckets.delete(key);
  }
  buckets.set(key, bucket);

  bucket.hits = prune(bucket.hits, now);

  if (bucket.hits.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: retryAfter(bucket.hits, now),
      limit,
      global: false,
    };
  }

  bucket.hits.push(now);
  if (countGlobal) globalHits.push(now);

  return {
    allowed: true,
    remaining: limit - bucket.hits.length,
    retryAfterSeconds: 0,
    limit,
    global: false,
  };
}

function retryAfter(times: number[], now: number): number {
  const oldest = times[0];
  if (oldest === undefined) return 1;
  return Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
}

/** True when a trusted reverse proxy sits in front of us. */
function behindTrustedProxy(): boolean {
  return Boolean(process.env.VERCEL || process.env.TRUST_PROXY === '1');
}

function header(headers: Record<string, unknown>, name: string): string | null {
  const raw = headers[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Client identity for rate limiting.
 *
 * The direction of trust in `X-Forwarded-For` is the thing to get right, and
 * it is the opposite of what feels natural. Proxies **append** the address they
 * observed, so the list reads `client, proxy1, proxy2`. A client that sends its
 * own `X-Forwarded-For: 1.2.3.4` gets the real address appended *after* it —
 * meaning the leftmost entry is whatever the caller typed, and is forged for
 * free. Reading it made the limiter bypassable by rotating one header
 * (confirmed: 25 requests against a limit of 3 all returned 200).
 *
 * So: prefer a header the platform sets and the client cannot influence; fall
 * back to the **rightmost** hop, which is the one our own proxy appended; and
 * when no proxy is known to be in front of us, ignore forwarding headers
 * entirely and use the socket address, because there they are just user input.
 */
export function clientIdFrom(headers: Record<string, unknown>, socketIp?: string): string {
  // Vercel overwrites this at the edge, so it cannot be spoofed by the caller.
  const platform = header(headers, 'x-vercel-forwarded-for');
  if (platform) return platform.split(',')[0]!.trim();

  if (behindTrustedProxy()) {
    const forwarded = header(headers, 'x-forwarded-for');
    if (forwarded) {
      const hops = forwarded.split(',').map((h) => h.trim()).filter(Boolean);
      const nearest = hops[hops.length - 1];
      if (nearest) return nearest;
    }
    const realIp = header(headers, 'x-real-ip');
    if (realIp) return realIp;
  }

  return socketIp || 'unknown';
}

export function rateLimitConfig() {
  return {
    window_ms: WINDOW_MS,
    max_per_ip: MAX_REQUESTS,
    max_per_ip_cached: CACHED_MAX_REQUESTS,
    global_max: GLOBAL_MAX_PER_WINDOW,
  };
}

export { CACHED_MAX_REQUESTS };

/** Test hook. */
export function rateLimitReset(): void {
  buckets.clear();
  globalHits = [];
}
