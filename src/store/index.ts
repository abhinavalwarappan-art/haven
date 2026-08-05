/**
 * Store selection.
 *
 * Priority:
 *   1. Supabase, when both credentials are present.
 *   2. In-memory, on serverless or when STORE=memory — the filesystem there is
 *      read-only apart from a per-instance /tmp that dies on cold start, so
 *      SQLite would add failure modes without adding persistence.
 *   3. SQLite, everywhere else. Zero config, real persistence.
 *
 * All three implement the same `Store` interface, so nothing upstream knows or
 * cares. Selection never throws: a storage problem must not take down checking,
 * which is the part that actually matters to someone holding a suspicious text.
 */

import type { Store } from '../lib/types.js';
import { createSqliteStore } from './sqlite.js';
import { createSupabaseStore } from './supabase.js';
import { createMemoryStore } from './memory.js';

let instance: Store | null = null;

/** True on Vercel and similar ephemeral-filesystem runtimes. */
function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function select(): Store {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return createSupabaseStore(url, key);

  if (process.env.STORE === 'memory' || isServerless()) return createMemoryStore();

  return createSqliteStore();
}

export function getStore(): Store {
  if (instance) return instance;

  try {
    instance = select();
  } catch (err) {
    console.error(
      '[store] falling back to in-memory:',
      err instanceof Error ? err.message : String(err)
    );
    instance = createMemoryStore();
  }
  return instance;
}

/** Test hook — lets the harness swap in a different store. */
export function setStore(store: Store): void {
  instance = store;
}
