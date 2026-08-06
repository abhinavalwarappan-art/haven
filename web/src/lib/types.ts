export type Verdict = 'scam' | 'uncertain_be_careful' | 'likely_safe';

export interface CheckResponse {
  verdict: Verdict;
  confidence: number;
  reasons: string[];
  meta?: {
    /** Set when the AI layer was unavailable and the answer is rules-only. */
    notice?: string | null;
    cached?: boolean;
    classifier?: string;
    model?: string;
    duration_ms?: number;
  } | null;
}

export interface Example {
  label: string;
  hint: string;
  text: string;
}

export interface Stats {
  total_checks: number;
  scams_flagged: number;
}
