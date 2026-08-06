/**
 * Shared types for the two-layer pipeline.
 *
 * Layer 1 (signals) produces evidence, never a verdict.
 * Layer 2 (classifier) weighs that evidence alongside its own reading and
 * produces the verdict. Keeping the boundary strict is what stops the tool
 * from crying wolf on legitimate messages that happen to sound urgent.
 */

export type Verdict = 'scam' | 'likely_safe' | 'uncertain_be_careful';

/** Stable identifiers for every pattern the rules layer can detect. */
export type FlagId =
  // Pressure and fear
  | 'urgency_language'
  | 'threat_language'
  | 'account_suspension_threat'
  // Money
  | 'gift_card_request'
  | 'wire_transfer_request'
  | 'crypto_payment_request'
  | 'p2p_payment_request'
  | 'unexpected_fee_request'
  // Links
  | 'url_shortener'
  | 'lookalike_domain'
  | 'suspicious_tld'
  | 'ip_address_url'
  | 'link_text_mismatch'
  | 'deep_subdomain_spoof'
  | 'raw_credential_request'
  // Identity
  | 'impersonates_organization'
  | 'generic_greeting'
  | 'contact_channel_switch'
  | 'unsolicited_relationship_opener'
  | 'prize_or_windfall'
  // Counter-evidence (reasons a message looks legitimate)
  | 'no_links_present'
  | 'no_payment_request'
  | 'no_urgency_pressure'
  | 'personalized_details'
  | 'recognized_brand_domain'
  | 'standard_optout_footer'
  | 'no_action_requested';

/** A single detector hit, with the text that triggered it. */
export interface SignalMatch {
  flag: FlagId;
  /** The exact substring that matched, truncated for safety. */
  evidence: string;
  /** Character offset of the match in the normalized text. */
  index: number;
  /** Detector-local note explaining *why* this matched, for the LLM's benefit. */
  detail?: string;
}

export type SignalCategory =
  | 'pressure'
  | 'payment'
  | 'links'
  | 'identity'
  | 'legitimacy';

export interface CategoryResult {
  category: SignalCategory;
  matches: SignalMatch[];
}

/** Everything the rules layer knows about a message. */
export interface SignalReport {
  /** Flags that fired, deduplicated, in detection order. */
  flagsDetected: FlagId[];
  /** Flags that are counter-evidence for legitimacy. Subset of flagsDetected. */
  legitimacySignals: FlagId[];
  categories: CategoryResult[];
  /** Every URL found, with what we could determine about it. */
  urls: UrlFinding[];
  /** Organizations the message claims to be from. */
  claimedOrganizations: string[];
  /**
   * 0-100 heuristic risk score. Advisory input to Layer 2 only — it is
   * deliberately NOT the verdict and is never surfaced as one.
   */
  riskScore: number;
  stats: {
    charCount: number;
    wordCount: number;
    linkCount: number;
    /** Ratio of non-ASCII characters — high values can indicate homoglyphs. */
    nonAsciiRatio: number;
    allCapsWordCount: number;
  };
}

export interface UrlFinding {
  /** The URL as it appeared, normalized. */
  raw: string;
  host: string | null;
  /** Registrable-ish domain, e.g. "amaz0n.com" from "login.amaz0n.com". */
  registrableDomain: string | null;
  isShortener: boolean;
  isIpLiteral: boolean;
  /** Brand this domain appears to be imitating, if any. */
  lookalikeOf: string | null;
  suspiciousTld: string | null;
  /** Subdomain count beyond the registrable domain. */
  subdomainDepth: number;
  /** For markdown/HTML links: the visible text disagreed with the href. */
  displayTextMismatch: { shown: string; actual: string } | null;
}

/** The classifier's structured output, before storage/serialization. */
export interface Classification {
  verdict: Verdict;
  confidence: number;
  reasons: string[];
  /** Which Layer 1 flags the model actually judged relevant. */
  citedFlags: FlagId[];
  /** Short internal note on why this confidence level. Not user-facing. */
  calibrationNote?: string;
}

/** The public API response shape for POST /api/check. */
export interface CheckResponse {
  verdict: Verdict;
  confidence: number;
  reasons: string[];
  flags_detected: FlagId[];
  raw_signals: SignalReport;
  meta: {
    /** Whether Layer 2 ran, or we fell back to rules-only. */
    classifier: 'ai' | 'heuristic_fallback';
    model: string | null;
    duration_ms: number;
    /** Stable id of the stored row, for later feedback/linking. */
    check_id: string | null;
    /**
     * True when this verdict was served from the cache rather than freshly
     * classified. Surfaced so a fast response can never be mistaken for a
     * fast *classification* — `duration_ms` stays honest either way.
     */
    cached: boolean;
    /**
     * Human-readable caveat when the result is degraded, else null. Exists so
     * an API consumer that renders only `reasons` still learns the AI layer
     * didn't run.
     */
    notice: string | null;
  };
}

/** A row in the `checks` table. Note: no raw text, ever. */
export interface CheckRecord {
  id: string;
  input_text_hash: string;
  input_length: number;
  verdict: Verdict;
  confidence: number;
  flags_detected: FlagId[];
  classifier: 'ai' | 'heuristic_fallback';
  created_at: string;
}

export interface StatsResponse {
  total_checks: number;
  scams_flagged: number;
  likely_safe: number;
  uncertain: number;
  /** Percentage of all checks that came back "scam", rounded to 1dp. */
  scam_rate: number;
}

export interface Store {
  recordCheck(
    record: Omit<CheckRecord, 'id' | 'created_at'>
  ): Promise<{ id: string } | null>;
  getStats(): Promise<StatsResponse>;
  readonly kind: 'supabase' | 'sqlite' | 'memory';
}
