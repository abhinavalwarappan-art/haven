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
 * Checking the three examples plus a few of their own messages is ~6 requests,
 * and a presenter running the demo script twice is more. The per-minute
 * allowance leaves room for that. Cache hits are metered separately and far
 * more loosely (see CACHED_MAX_REQUESTS), so re-running an example never eats
 * into the allowance for real checks.
 *
 * Two tiers, because they stop different things. The per-minute limit stops a
 * burst. The per-hour limit stops the slow grind that stays under it: a minute
 * window resets 1,440 times a day, so on its own it caps nothing daily.
 *
 * Note which tier actually bounds spend. The hourly ceiling is the binding one,
 * so loosening the per-minute limit costs nothing in daily exposure: it only
 * changes how fast a caller may spend the same hourly budget.
 */

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 8);

const HOUR_MS = Number(process.env.RATE_LIMIT_HOUR_MS || 3_600_000);
/** Sustained ceiling per caller. Only paid work counts toward it. */
const MAX_PER_HOUR = Number(process.env.RATE_LIMIT_HOURLY_MAX || 100);

/**
 * Burst guard across all callers on THIS instance.
 *
 * Deliberately not called a global cost ceiling any more, because on serverless
 * it is not one: `globalHits` is module scope, so every warm instance gets its
 * own 240 and the real ceiling is 240 × however many instances are running.
 * It still does useful work (one instance cannot be driven flat out by a fan-out
 * of many IPs), but the genuinely shared limit is the Vercel edge rule, and the
 * only true spend ceiling is the quota set on the Gemini key itself.
 */
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

function prune(times: number[], now: number, windowMs = WINDOW_MS): number[] {
  const cutoff = now - windowMs;
  // Timestamps are appended in order, so the first in-window index is the split.
  let i = 0;
  while (i < times.length && times[i]! <= cutoff) i++;
  return i === 0 ? times : times.slice(i);
}

/**
 * Fetch a bucket, pruning it to `windowMs`, and refresh its position so the
 * eviction below drops the least *recently seen* client.
 */
function takeBucket(key: string, now: number, windowMs: number): Bucket {
  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= MAX_TRACKED_CLIENTS) {
      const oldest = buckets.keys().next().value;
      if (oldest !== undefined) buckets.delete(oldest);
    }
    bucket = { hits: [] };
  } else {
    // Map preserves insertion order, which is not the same as recency unless we
    // refresh it here. Without this, an actively-limited client that was seen
    // first is the first one evicted, releasing its limit.
    buckets.delete(key);
  }
  buckets.set(key, bucket);
  bucket.hits = prune(bucket.hits, now, windowMs);
  return bucket;
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
  // plus re-checks of that same text filled the bucket, and the next new
  // message was refused — while the refusal text said re-checking is always
  // free. The budget class has to be part of the key.
  const key = countGlobal ? clientId : `cached:${clientId}`;

  const minute = takeBucket(key, now, WINDOW_MS);
  if (minute.hits.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: retryAfter(minute.hits, now, WINDOW_MS),
      limit,
      global: false,
    };
  }

  // The sustained tier, checked only for work that costs money. Cache hits are
  // free, so capping them by the hour would punish the one usage pattern we
  // actively want (re-checking a message you already checked).
  let hour: Bucket | null = null;
  if (countGlobal) {
    hour = takeBucket(`hour:${key}`, now, HOUR_MS);
    if (hour.hits.length >= MAX_PER_HOUR) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: retryAfter(hour.hits, now, HOUR_MS),
        limit: MAX_PER_HOUR,
        global: false,
      };
    }
  }

  minute.hits.push(now);
  if (hour) hour.hits.push(now);
  if (countGlobal) globalHits.push(now);

  // Report whichever tier is closest to running out, so the header a caller
  // sees is the one that will actually stop them.
  const remaining = hour
    ? Math.min(limit - minute.hits.length, MAX_PER_HOUR - hour.hits.length)
    : limit - minute.hits.length;

  return {
    allowed: true,
    remaining,
    retryAfterSeconds: 0,
    limit,
    global: false,
  };
}

function retryAfter(times: number[], now: number, windowMs = WINDOW_MS): number {
  const oldest = times[0];
  if (oldest === undefined) return 1;
  return Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
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
    hour_ms: HOUR_MS,
    max_per_ip_hour: MAX_PER_HOUR,
    global_max: GLOBAL_MAX_PER_WINDOW,
  };
}

export { CACHED_MAX_REQUESTS };

/** Test hook. */
export function rateLimitReset(): void {
  buckets.clear();
  globalHits = [];
}
