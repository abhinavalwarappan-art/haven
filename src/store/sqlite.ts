/**
 * Local SQLite store — the zero-config default.
 *
 * Uses Node's built-in `node:sqlite` (Node 22.5+), so there is no native
 * dependency to compile and the project runs immediately after `npm install`.
 * The schema mirrors supabase/migrations/0001_init.sql so switching to
 * Postgres is a config change, not a code change.
 */

import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { CheckRecord, StatsResponse, Store } from '../lib/types.js';

const DEFAULT_PATH = 'data/checks.db';

export function createSqliteStore(path = process.env.SQLITE_PATH || DEFAULT_PATH): Store {
  // Required lazily rather than imported at module scope. `node:sqlite` only
  // exists on Node 22.5+, and this module gets imported by the store selector
  // on every platform — including serverless, where the memory store is used
  // instead. A top-level import would make an unused dependency fatal.
  const require = createRequire(import.meta.url);
  const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');

  const file = resolve(path);
  mkdirSync(dirname(file), { recursive: true });

  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS checks (
      id              TEXT PRIMARY KEY,
      input_text_hash TEXT NOT NULL,
      input_length    INTEGER NOT NULL,
      verdict         TEXT NOT NULL,
      confidence      INTEGER NOT NULL,
      flags_detected  TEXT NOT NULL DEFAULT '[]',
      classifier      TEXT NOT NULL DEFAULT 'ai',
      created_at      TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS checks_created_at_idx ON checks (created_at DESC);
    CREATE INDEX IF NOT EXISTS checks_verdict_idx    ON checks (verdict);
  `);

  const insert = db.prepare(`
    INSERT INTO checks
      (id, input_text_hash, input_length, verdict, confidence, flags_detected, classifier, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const stats = db.prepare(`
    SELECT
      COUNT(*)                                                    AS total_checks,
      SUM(CASE WHEN verdict = 'scam' THEN 1 ELSE 0 END)           AS scams_flagged,
      SUM(CASE WHEN verdict = 'likely_safe' THEN 1 ELSE 0 END)    AS likely_safe,
      SUM(CASE WHEN verdict = 'uncertain_be_careful' THEN 1 ELSE 0 END) AS uncertain
    FROM checks
  `);

  return {
    kind: 'sqlite',

    async recordCheck(record: Omit<CheckRecord, 'id' | 'created_at'>) {
      const id = randomUUID();
      insert.run(
        id,
        record.input_text_hash,
        record.input_length,
        record.verdict,
        record.confidence,
        JSON.stringify(record.flags_detected),
        record.classifier,
        new Date().toISOString()
      );
      return { id };
    },

    async getStats(): Promise<StatsResponse> {
      const row = stats.get() as Record<string, number | null> | undefined;
      const total = Number(row?.total_checks ?? 0);
      const scams = Number(row?.scams_flagged ?? 0);
      return {
        total_checks: total,
        scams_flagged: scams,
        likely_safe: Number(row?.likely_safe ?? 0),
        uncertain: Number(row?.uncertain ?? 0),
        scam_rate: total > 0 ? Number(((scams / total) * 100).toFixed(1)) : 0,
      };
    },
  };
}
