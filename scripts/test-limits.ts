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

// ── Global ceiling ────────────────────────────────────────────────────────
section('Global ceiling (cost circuit-breaker)');

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

ok('prefers x-forwarded-for', clientIdFrom({ 'x-forwarded-for': '203.0.113.7' }, '10.0.0.1') === '203.0.113.7');
ok(
  'takes only the first forwarded hop (rest are attacker-controlled)',
  clientIdFrom({ 'x-forwarded-for': '203.0.113.7, 10.0.0.5, 172.16.0.9' }, '10.0.0.1') === '203.0.113.7'
);
ok('falls back to x-real-ip', clientIdFrom({ 'x-real-ip': '198.51.100.4' }, '10.0.0.1') === '198.51.100.4');
ok('falls back to the socket address', clientIdFrom({}, '10.0.0.1') === '10.0.0.1');
ok('never returns empty', clientIdFrom({ 'x-forwarded-for': '   ' }, undefined) === 'unknown');

// ── Cache ─────────────────────────────────────────────────────────────────
section('Verdict cache');

const fakeSignals = { flagsDetected: [], legitimacySignals: [], riskScore: 0 } as unknown as SignalReport;
const entry = {
  verdict: 'scam' as const,
  confidence: 90,
  reasons: ['because'],
  flags_detected: [],
  raw_signals: fakeSignals,
  classifier: 'claude' as const,
  model: 'claude-opus-5',
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

// A degraded answer must never be pinned in place.
cacheClear();
cacheStore('degraded', { ...entry, classifier: 'heuristic_fallback', model: null });
ok('refuses to cache a rules-only fallback verdict', !cacheHas('degraded'));

// Bounded growth.
cacheClear();
const max = cacheStats().max_entries;
for (let i = 0; i < max + 50; i++) cacheStore(`k${i}`, entry);
ok(`evicts to stay within max_entries (${max})`, cacheStats().size <= max, String(cacheStats().size));
ok('evicts the oldest first', !cacheHas('k0'));
ok('keeps the newest', cacheHas(`k${max + 49}`));

// ── Summary ───────────────────────────────────────────────────────────────
process.stdout.write(`\n${passed} passed, ${failed} failed\n\n`);
if (failed > 0) process.exitCode = 1;
