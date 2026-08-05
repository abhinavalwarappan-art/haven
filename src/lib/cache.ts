/**
 * Verdict cache, keyed on the salted hash of the input.
 *
 * Why this exists: a check costs ~6 seconds and a paid API call. During a demo
 * the same three example messages get pasted over and over, and during
 * rehearsal the same test input gets run dozens of times. Re-deriving an
 * identical verdict for identical text is pure waste.
 *
 * What it deliberately does NOT do: make first-time checks look fast. A cache
 * hit is only ever returned for text we have genuinely classified before, and
 * the response is tagged `meta.cached = true` with `duration_ms` reporting the
 * real (near-zero) lookup time. The honest ~6s number is still what a judge
 * sees the first time they paste something of their own — which is the number
 * that actually matters, so it must not be disguised.
 *
 * Keyed on the same salted HMAC used for storage, so the cache holds no
 * recoverable plaintext either.
 */

import type { CheckResponse } from './types.js';

/** Cached long enough to cover a demo session, short enough to stay fresh. */
const TTL_MS = Number(process.env.CACHE_TTL_MS || 60 * 60 * 1000);

/** Bounded so a long-running instance cannot grow without limit. */
const MAX_ENTRIES = Number(process.env.CACHE_MAX_ENTRIES || 500);

/** The parts of a response that are genuinely a property of the input. */
type CachedVerdict = Omit<CheckResponse, 'meta'> & {
  classifier: CheckResponse['meta']['classifier'];
  model: CheckResponse['meta']['model'];
};

interface Entry {
  value: CachedVerdict;
  expiresAt: number;
}

const store = new Map<string, Entry>();

let hits = 0;
let misses = 0;

export function cacheLookup(hash: string): CachedVerdict | null {
  const entry = store.get(hash);
  if (!entry) {
    misses++;
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    store.delete(hash);
    misses++;
    return null;
  }

  // Refresh recency so the eviction below drops genuinely cold entries.
  store.delete(hash);
  store.set(hash, entry);
  hits++;
  return entry.value;
}

/**
 * Is there a live entry for this hash? Does not count as a hit or a miss.
 *
 * Used by the route to decide whether a request will do paid work before it
 * spends rate-limit quota on it — re-checking a cached message costs nothing,
 * so it should not count against a judge's allowance.
 */
export function cacheHas(hash: string): boolean {
  const entry = store.get(hash);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(hash);
    return false;
  }
  return true;
}

export function cacheStore(hash: string, value: CachedVerdict): void {
  // A rules-only answer is a degraded result produced because the AI layer was
  // unavailable. Caching it would pin that degradation in place for an hour
  // after the API recovered.
  if (value.classifier === 'heuristic_fallback') return;

  if (store.size >= MAX_ENTRIES) {
    // Map preserves insertion order, so the first key is the least recently
    // used given the re-insert on hit above.
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(hash, { value, expiresAt: Date.now() + TTL_MS });
}

export function cacheStats() {
  return { size: store.size, hits, misses, ttl_ms: TTL_MS, max_entries: MAX_ENTRIES };
}

/** Test hook. */
export function cacheClear(): void {
  store.clear();
  hits = misses = 0;
}
