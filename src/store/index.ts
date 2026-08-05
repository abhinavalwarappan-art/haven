/**
 * Store selection.
 *
 * Supabase when both credentials are present, local SQLite otherwise. Both
 * implement the same `Store` interface, so nothing upstream knows or cares.
 */

import type { Store } from '../lib/types.js';
import { createSqliteStore } from './sqlite.js';
import { createSupabaseStore } from './supabase.js';

let instance: Store | null = null;

export function getStore(): Store {
  if (instance) return instance;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  instance = url && key ? createSupabaseStore(url, key) : createSqliteStore();
  return instance;
}

/** Test hook — lets the harness swap in an in-memory store. */
export function setStore(store: Store): void {
  instance = store;
}
