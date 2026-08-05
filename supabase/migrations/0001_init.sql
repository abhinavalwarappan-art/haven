-- "Is This Real?" — initial schema
--
-- Privacy note: the `checks` table deliberately contains NO raw message text.
-- Users paste messages that routinely include their own name, account numbers
-- and phone numbers. We store only a salted HMAC of the normalized text, which
-- is enough to count duplicate submissions but cannot be reversed.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- checks: one row per scam check performed. Powers /api/stats.
-- ---------------------------------------------------------------------------
create table if not exists public.checks (
  id              uuid primary key default gen_random_uuid(),

  -- Salted HMAC-SHA256 of the normalized input. Never the text itself.
  input_text_hash text not null,

  -- Length is kept for analytics (are people pasting emails or texts?).
  input_length    integer not null check (input_length >= 0),

  verdict         text not null
                    check (verdict in ('scam', 'likely_safe', 'uncertain_be_careful')),
  confidence      integer not null check (confidence between 0 and 100),

  -- Array of Layer 1 flag ids, e.g. ["urgency_language","lookalike_domain"].
  flags_detected  jsonb not null default '[]'::jsonb,

  -- Whether the AI agent ran, or we degraded to the rules-only fallback.
  classifier      text not null default 'claude'
                    check (classifier in ('claude', 'heuristic_fallback')),

  created_at      timestamptz not null default now()
);

create index if not exists checks_created_at_idx on public.checks (created_at desc);
create index if not exists checks_verdict_idx     on public.checks (verdict);
create index if not exists checks_hash_idx        on public.checks (input_text_hash);

comment on table public.checks is
  'One row per scam check. Contains no raw user text — only a salted hash.';
comment on column public.checks.input_text_hash is
  'Salted HMAC-SHA256 of the normalized input. Not reversible. Rotating HASH_SALT unlinks old rows by design.';

-- ---------------------------------------------------------------------------
-- family_links: STUB ONLY (stretch goal, not implemented).
--
-- The intended feature: an adult child ("protector") is alerted by email when
-- a parent ("protected") checks a message that comes back as a scam. Schema is
-- created now so the migration is stable; no application code reads or writes
-- this table yet.
-- ---------------------------------------------------------------------------
create table if not exists public.family_links (
  id                  uuid primary key default gen_random_uuid(),
  protector_user_id   uuid not null,
  protected_user_id   uuid not null,
  alert_email         text not null,

  -- Reserved for the alerting logic that is not built yet.
  alert_on_verdict    text not null default 'scam'
                        check (alert_on_verdict in ('scam', 'scam_or_uncertain')),
  is_active           boolean not null default true,
  confirmed_at        timestamptz,

  created_at          timestamptz not null default now(),

  constraint family_links_distinct_users check (protector_user_id <> protected_user_id),
  constraint family_links_unique_pair unique (protector_user_id, protected_user_id)
);

create index if not exists family_links_protected_idx
  on public.family_links (protected_user_id) where is_active;

comment on table public.family_links is
  'STUB — schema only. Family alerting is a stretch goal and is not implemented.';

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Both tables are locked down. The API writes with the service role key, which
-- bypasses RLS. No anon/authenticated policies are granted, so the public
-- Supabase key cannot read individual check rows.
-- ---------------------------------------------------------------------------
alter table public.checks       enable row level security;
alter table public.family_links enable row level security;

-- ---------------------------------------------------------------------------
-- Aggregate view for the public demo counter. Exposes only counts, never rows.
-- ---------------------------------------------------------------------------
create or replace view public.check_stats as
  select
    count(*)                                                as total_checks,
    count(*) filter (where verdict = 'scam')                as scams_flagged,
    count(*) filter (where verdict = 'likely_safe')         as likely_safe,
    count(*) filter (where verdict = 'uncertain_be_careful') as uncertain
  from public.checks;

comment on view public.check_stats is
  'Aggregate counters for the demo. Safe to expose publicly — no per-row data.';
