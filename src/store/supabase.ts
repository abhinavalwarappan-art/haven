/**
 * Supabase (Postgres) store.
 *
 * Activated automatically when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are
 * both set. Apply supabase/migrations/0001_init.sql first.
 *
 * Uses the service role key because `checks` has RLS enabled with no public
 * policies — the anon key deliberately cannot read individual rows.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { CheckRecord, StatsResponse, Store } from '../lib/types.js';

export function createSupabaseStore(url: string, serviceKey: string): Store {
  const supabase: SupabaseClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    kind: 'supabase',

    async recordCheck(record: Omit<CheckRecord, 'id' | 'created_at'>) {
      const { data, error } = await supabase
        .from('checks')
        .insert({
          input_text_hash: record.input_text_hash,
          input_length: record.input_length,
          verdict: record.verdict,
          confidence: record.confidence,
          flags_detected: record.flags_detected,
          classifier: record.classifier,
        })
        .select('id')
        .single();

      if (error) throw new Error(`Supabase insert failed: ${error.message}`);
      return { id: data.id as string };
    },

    async getStats(): Promise<StatsResponse> {
      // Read the aggregate view rather than the base table, so this path never
      // pulls individual rows into the application.
      const { data, error } = await supabase
        .from('check_stats')
        .select('total_checks, scams_flagged, likely_safe, uncertain')
        .single();

      if (error) throw new Error(`Supabase stats query failed: ${error.message}`);

      const total = Number(data.total_checks ?? 0);
      const scams = Number(data.scams_flagged ?? 0);
      return {
        total_checks: total,
        scams_flagged: scams,
        likely_safe: Number(data.likely_safe ?? 0),
        uncertain: Number(data.uncertain ?? 0),
        scam_rate: total > 0 ? Number(((scams / total) * 100).toFixed(1)) : 0,
      };
    },
  };
}
