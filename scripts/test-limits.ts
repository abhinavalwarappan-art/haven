/**
 * Rate-limit and cache unit checks.
 *
 *   npm run test:limits
 *
 * Deliberately exercises the modules directly rather than over HTTP: the
 * behaviour that matters (window sliding, global ceiling, per-client
 * isolation, cache TTL and eviction) needs dozens of calls, and doing that
 * end-to-end would mean dozens of paid API calls to test logic that touches
 * neither the API nor the model.
 */

import { consume, rateLimitReset, clientIdFrom, rateLimitConfig } from '../src/lib/rate-limit.js';
import { cacheLookup, cacheStore, cacheHas, cacheClear, cacheStats } from '../src/lib/cache.js';
import { hashInput, hashExact } from '../src/lib/privacy.js';
import { analyzeSignals } from '../src/lib/signals/index.js';
import type { SignalReport } from '../src/lib/types.js';

let passed = 0;
let failed = 0;

function ok(name: string, condition: boolean, detail = '') {
  if (condition) {
    passed++;
    process.stdout.write(`  ✅ ${name}\n`);
  } else {
    failed++;
    process.stdout.write(`  ❌ ${name}${detail ? ` — ${detail}` : ''}\n`);
  }
}

function section(title: string) {
  process.stdout.write(`\n${title}\n`);
}

const cfg = rateLimitConfig();
const LIMIT = cfg.max_per_ip;
const WINDOW = cfg.window_ms;

// ── Rate limiting ─────────────────────────────────────────────────────────
section(`Rate limiting (${LIMIT} per ${WINDOW / 1000}s per IP)`);

rateLimitReset();
const t0 = 1_000_000;

let lastAllowed = true;
for (let i = 1; i <= LIMIT; i++) {
  lastAllowed = consume('1.2.3.4', t0).allowed;
}
ok(`allows exactly ${LIMIT} requests in the window`, lastAllowed);

const overLimit = consume('1.2.3.4', t0);
ok('blocks request beyond the limit', !overLimit.allowed);
ok('reports a retry-after in seconds', overLimit.retryAfterSeconds > 0 && overLimit.retryAfterSeconds <= WINDOW / 1000,
  String(overLimit.retryAfterSeconds));
ok('reports the per-IP limit, not the global one', overLimit.limit === LIMIT && !overLimit.global);

// A different caller must be unaffected.
ok('other IPs are unaffected', consume('9.9.9.9', t0).allowed);

// Window slides: one tick past the window and the earliest hit ages out.
ok('allows again once the window slides', consume('1.2.3.4', t0 + WINDOW + 1).allowed);

// Partial slide: still blocked halfway through.
rateLimitReset();
for (let i = 0; i < LIMIT; i++) consume('5.5.5.5', t0);
ok('still blocked halfway through the window', !consume('5.5.5.5', t0 + WINDOW / 2).allowed);

// ── Hourly ceiling ────────────────────────────────────────────────────────
// The per-minute limit alone caps nothing daily: its window resets 1440 times
// a day, so a loop that waits out each minute runs unbounded. These assert the
// sustained tier that stops that.
const HOUR_LIMIT = cfg.max_per_ip_hour;
const HOUR = cfg.hour_ms;
section(`Hourly ceiling (${HOUR_LIMIT} per ${HOUR / 60000}min per IP)`);

rateLimitReset();
// Drip-feed at the minute limit, spacing each burst a full minute apart so the
// per-minute tier never fires. Only the hourly tier can stop this.
let paid = 0;
let hourBlocked: ReturnType<typeof consume> | null = null;
for (let m = 0; m < 100 && !hourBlocked; m++) {
  for (let i = 0; i < LIMIT; i++) {
    const r = consume('7.7.7.7', t0 + m * (WINDOW + 1));
    if (!r.allowed) { hourBlocked = r; break; }
    paid++;
  }
}
ok('a minute-spaced drip is eventually stopped', hourBlocked !== null);
ok(`stops after exactly ${HOUR_LIMIT} paid checks`, paid === HOUR_LIMIT, `allowed ${paid}`);
ok('reports the hourly limit, not the per-minute one', hourBlocked?.limit === HOUR_LIMIT);
ok('is a per-IP block, not the global ceiling', hourBlocked?.global === false);
ok(
  'retry-after can exceed one minute',
  (hourBlocked?.retryAfterSeconds ?? 0) > WINDOW / 1000,
  `${hourBlocked?.retryAfterSeconds}s`
);

// Another IP is untouched by the first one's hourly exhaustion.
ok('other IPs keep their own hourly budget', consume('8.8.8.8', t0).allowed);

// Cache hits are free, so they must not consume the hourly paid budget.
rateLimitReset();
for (let i = 0; i < HOUR_LIMIT + 10; i++) {
  consume('6.6.6.6', t0 + i * (WINDOW + 1), { limit: cfg.max_per_ip_cached, countGlobal: false });
}
ok('cache hits never spend the hourly paid budget', consume('6.6.6.6', t0).allowed);

// ── Global ceiling ────────────────────────────────────────────────────────
section('Per-instance burst guard');

rateLimitReset();
let globalTripped = false;
let requestsUntilTrip = 0;
// Spread across many IPs so the per-IP limit never fires first.
outer: for (let ip = 0; ip < 500; ip++) {
  for (let n = 0; n < LIMIT; n++) {
    const r = consume(`10.0.${Math.floor(ip / 256)}.${ip % 256}`, t0);
    requestsUntilTrip++;
    if (!r.allowed) {
      globalTripped = r.global;
      break outer;
    }
  }
}
ok('global ceiling trips when many IPs flood', globalTripped);
ok(
  `global ceiling trips at the configured ${cfg.global_max}`,
  requestsUntilTrip === cfg.global_max + 1,
  `tripped at request ${requestsUntilTrip}`
);

// ── Client identification ─────────────────────────────────────────────────
section('Client identification');

// The security-critical property: with no trusted proxy in front of us,
// forwarding headers are just user input and must be ignored entirely.
// Reading them made the per-IP limiter bypassable by rotating one header.
delete process.env.VERCEL;
delete process.env.TRUST_PROXY;

ok(
  'IGNORES x-forwarded-for when no proxy is trusted (spoof defence)',
  clientIdFrom({ 'x-forwarded-for': '203.0.113.7' }, '10.0.0.1') === '10.0.0.1'
);
ok(
  'IGNORES x-real-ip when no proxy is trusted',
  clientIdFrom({ 'x-real-ip': '198.51.100.4' }, '10.0.0.1') === '10.0.0.1'
);
ok('falls back to the socket address', clientIdFrom({}, '10.0.0.1') === '10.0.0.1');
ok('never returns empty', clientIdFrom({ 'x-forwarded-for': '   ' }, undefined) === 'unknown');

// Platform header wins unconditionally — Vercel overwrites it at the edge.
ok(
  'prefers the platform header the client cannot forge',
  clientIdFrom(
    { 'x-vercel-forwarded-for': '203.0.113.7', 'x-forwarded-for': '1.1.1.1' },
    '10.0.0.1'
  ) === '203.0.113.7'
);

process.env.TRUST_PROXY = '1';
ok(
  'behind a trusted proxy, takes the RIGHTMOST hop (the one our proxy appended)',
  clientIdFrom({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 203.0.113.7' }, '10.0.0.1') ===
    '203.0.113.7',
  'leftmost is client-supplied and forgeable; proxies append to the right'
);
ok(
  'a forged leading entry cannot displace the real hop',
  clientIdFrom({ 'x-forwarded-for': 'evil-spoof, 203.0.113.7' }, '10.0.0.1') === '203.0.113.7'
);
ok(
  'behind a trusted proxy, falls back to x-real-ip',
  clientIdFrom({ 'x-real-ip': '198.51.100.4' }, '10.0.0.1') === '198.51.100.4'
);
delete process.env.TRUST_PROXY;

// ── Cache ─────────────────────────────────────────────────────────────────
section('Verdict cache');

const fakeSignals = { flagsDetected: [], legitimacySignals: [], riskScore: 0 } as unknown as SignalReport;
const entry = {
  verdict: 'scam' as const,
  confidence: 90,
  reasons: ['because'],
  flags_detected: [],
  raw_signals: fakeSignals,
  classifier: 'ai' as const,
  model: 'gemini-3.1-flash-lite',
};

cacheClear();
ok('miss on unknown key', cacheLookup('abc') === null);
ok('cacheHas is false for unknown key', !cacheHas('abc'));

cacheStore('abc', entry);
ok('cacheHas is true after store', cacheHas('abc'));
ok('hit returns the stored verdict', cacheLookup('abc')?.verdict === 'scam');

// cacheHas must not disturb the hit/miss counters the route relies on.
const before = cacheStats();
cacheHas('abc');
cacheHas('nope');
const after = cacheStats();
ok('cacheHas does not affect hit/miss stats', before.hits === after.hits && before.misses === after.misses);

// A degraded answer IS cached, but briefly — long enough that repeats during
// an outage stay free, short enough that a real verdict takes over soon after
// the API recovers. Not caching it at all made the failure modes compound:
// nothing cached -> every repeat burns quota -> 429 on top of a degraded answer.
cacheClear();
cacheStore('degraded', { ...entry, classifier: 'heuristic_fallback', model: null });
ok('caches a rules-only fallback (so repeats stay free during an outage)', cacheHas('degraded'));
ok(
  'but with a much shorter TTL than a real verdict',
  cacheStats().fallback_ttl_ms < cacheStats().ttl_ms,
  `fallback=${cacheStats().fallback_ttl_ms} full=${cacheStats().ttl_ms}`
);

// Bounded growth.
cacheClear();
const max = cacheStats().max_entries;
for (let i = 0; i < max + 50; i++) cacheStore(`k${i}`, entry);
ok(`evicts to stay within max_entries (${max})`, cacheStats().size <= max, String(cacheStats().size));
ok('evicts the oldest first', !cacheHas('k0'));
ok('keeps the newest', cacheHas(`k${max + 49}`));

// ── Cache key vs storage key ──────────────────────────────────────────────
section('Hashing: cache key must be exact, storage key normalized');

const shouted = 'URGENT ACT NOW YOUR ACCOUNT WILL BE CLOSED';
const quiet = shouted.toLowerCase();

ok(
  'storage hash normalizes case (dedupes the same scam across senders)',
  hashInput(shouted) === hashInput(quiet)
);
ok(
  'cache key does NOT normalize case',
  hashExact(shouted) !== hashExact(quiet),
  'ALL-CAPS and lowercase would share a cache entry, so the cached raw_signals ' +
    'would report the wrong shouted-word count for whichever text was not classified'
);
ok('cache key is stable for byte-identical text', hashExact(shouted) === hashExact(`${shouted}`));
ok(
  'Layer 1 really is case-sensitive (this is why the split matters)',
  analyzeSignals(shouted).stats.allCapsWordCount !== analyzeSignals(quiet).stats.allCapsWordCount
);

// ── Summary ───────────────────────────────────────────────────────────────
process.stdout.write(`\n${passed} passed, ${failed} failed\n\n`);
if (failed > 0) process.exitCode = 1;
