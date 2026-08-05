/**
 * In-process store.
 *
 * Used on serverless (Vercel), where the filesystem is read-only apart from a
 * per-instance /tmp that is wiped on every cold start. SQLite there would buy
 * nothing over a Map — same per-instance lifetime, same loss on cold start —
 * while adding a filesystem that can fail.
 *
 * The honest consequence: on Vercel the demo counter reflects one warm
 * instance, not all traffic, and resets when that instance recycles. That is
 * documented in DECISIONS.md as an accepted hackathon tradeoff, and the
 * Supabase adapter is the drop-in fix if it ever needs to be real.
 */

import { randomUUID } from 'node:crypto';
import type { CheckRecord, StatsResponse, Store } from '../lib/types.js';

export function createMemoryStore(): Store {
  const rows: CheckRecord[] = [];

  /** Bounded — a warm instance serving a busy demo must not grow forever. */
  const MAX_ROWS = 10_000;

  return {
    kind: 'memory',

    async recordCheck(record: Omit<CheckRecord, 'id' | 'created_at'>) {
      const row: CheckRecord = {
        ...record,
        id: randomUUID(),
        created_at: new Date().toISOString(),
      };
      rows.push(row);
      if (rows.length > MAX_ROWS) rows.splice(0, rows.length - MAX_ROWS);
      return { id: row.id };
    },

    async getStats(): Promise<StatsResponse> {
      const total = rows.length;
      const scams = rows.filter((r) => r.verdict === 'scam').length;
      return {
        total_checks: total,
        scams_flagged: scams,
        likely_safe: rows.filter((r) => r.verdict === 'likely_safe').length,
        uncertain: rows.filter((r) => r.verdict === 'uncertain_be_careful').length,
        scam_rate: total > 0 ? Number(((scams / total) * 100).toFixed(1)) : 0,
      };
    },
  };
}
