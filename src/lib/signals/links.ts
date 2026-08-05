/**
 * URL extraction and analysis.
 *
 * Covers the four link tricks that actually show up in the wild:
 *   1. Shorteners that hide the destination entirely.
 *   2. Lookalike domains — amaz0n.com, paypa1.com, wellsfarg0.com.
 *   3. Brand-in-subdomain spoofing — paypal.com.secure-verify.xyz, where the
 *      real registrable domain is secure-verify.xyz and "paypal.com" is decoration.
 *   4. Display text that disagrees with the actual href.
 */

import type { FlagId, SignalMatch, UrlFinding } from '../types.js';
import type { NormalizedText } from '../normalize.js';
import { clipEvidence } from '../privacy.js';

const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly',
  'rebrand.ly', 'cutt.ly', 'shorturl.at', 'tiny.cc', 'lnkd.in', 'rb.gy',
  'short.link', 'linktr.ee', 't.ly', 'bl.ink', 'snip.ly', 'clck.ru', 'v.gd',
  'shrtco.de', 'urlz.fr', 'qr.link', 'shorte.st', 'adf.ly', 'tr.im', 'x.co',
]);

/** TLDs heavily over-represented in phishing relative to legitimate use. */
const SUSPICIOUS_TLDS = new Set([
  'zip', 'mov', 'top', 'xyz', 'tk', 'ml', 'ga', 'cf', 'gq', 'buzz', 'click',
  'link', 'work', 'rest', 'country', 'kim', 'loan', 'download', 'racing',
  'win', 'bid', 'stream', 'review', 'date', 'faith', 'science', 'party',
  'cam', 'sbs', 'cfd', 'icu', 'quest', 'monster', 'lol', 'live', 'shop',
]);

/**
 * Brands most often impersonated, with their real domains. Used both for
 * lookalike scoring and, inversely, to credit a message that links to the
 * genuine article.
 */
const BRANDS: Array<{ name: string; domains: string[] }> = [
  { name: 'Amazon', domains: ['amazon.com', 'amazon.co.uk'] },
  { name: 'Apple', domains: ['apple.com', 'icloud.com'] },
  { name: 'Microsoft', domains: ['microsoft.com', 'live.com', 'outlook.com', 'office.com'] },
  { name: 'Google', domains: ['google.com', 'gmail.com', 'youtube.com'] },
  { name: 'PayPal', domains: ['paypal.com'] },
  { name: 'Netflix', domains: ['netflix.com'] },
  { name: 'USPS', domains: ['usps.com'] },
  { name: 'FedEx', domains: ['fedex.com'] },
  { name: 'UPS', domains: ['ups.com'] },
  { name: 'DHL', domains: ['dhl.com'] },
  { name: 'Chase', domains: ['chase.com'] },
  { name: 'Bank of America', domains: ['bankofamerica.com', 'bofa.com'] },
  { name: 'Wells Fargo', domains: ['wellsfargo.com'] },
  { name: 'Citibank', domains: ['citi.com', 'citibank.com'] },
  { name: 'Capital One', domains: ['capitalone.com'] },
  { name: 'IRS', domains: ['irs.gov'] },
  { name: 'Social Security Administration', domains: ['ssa.gov'] },
  { name: 'Walmart', domains: ['walmart.com'] },
  { name: 'Costco', domains: ['costco.com'] },
  { name: 'Target', domains: ['target.com'] },
  { name: 'Instagram', domains: ['instagram.com'] },
  { name: 'Facebook', domains: ['facebook.com', 'fb.com'] },
  { name: 'Coinbase', domains: ['coinbase.com'] },
  { name: 'Venmo', domains: ['venmo.com'] },
  { name: 'Zelle', domains: ['zellepay.com'] },
  { name: 'Verizon', domains: ['verizon.com'] },
  { name: 'AT&T', domains: ['att.com'] },
  { name: 'T-Mobile', domains: ['t-mobile.com'] },
  { name: 'Geek Squad', domains: ['bestbuy.com'] },
  { name: 'McAfee', domains: ['mcafee.com'] },
  { name: 'Norton', domains: ['norton.com'] },
];

const KNOWN_GOOD_DOMAINS = new Set(BRANDS.flatMap((b) => b.domains));

/** Multi-part public suffixes we need to look past to find the real domain. */
const MULTIPART_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'co.jp', 'co.nz', 'co.za', 'com.au',
  'com.br', 'com.mx', 'com.cn', 'co.in', 'co.kr', 'com.sg',
]);

const URL_RE =
  /\b(?:https?:\/\/|www\.)[^\s<>"'`\])]+|\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.(?:com|net|org|gov|edu|io|co|us|uk|info|biz|app|dev|me|tv|shop|xyz|top|click|link|live|online|site|store|zip|mov|tk|ml|ga|cf|gq|buzz|icu|cfd|sbs|lol|win|bid|cam|quest|monster|rest)\b(?:\/[^\s<>"'`\])]*)?/gi;

/** Markdown [text](url) and HTML <a href="url">text</a>. */
const MARKDOWN_LINK_RE = /\[([^\]]{1,120})\]\(\s*([^)\s]+)\s*\)/g;
const HTML_LINK_RE = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;

function parseHost(raw: string): string | null {
  try {
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
    const host = new URL(withScheme).hostname.toLowerCase();
    return host.replace(/\.$/, '') || null;
  } catch {
    return null;
  }
}

function isIpLiteral(host: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.startsWith('[');
}

/** Best-effort registrable domain ("example.co.uk" from "a.b.example.co.uk"). */
export function registrableDomain(host: string): string {
  const parts = host.split('.');
  if (parts.length <= 2) return host;
  const lastTwo = parts.slice(-2).join('.');
  if (MULTIPART_SUFFIXES.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return lastTwo;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 99;
  // Single row rolling DP — inputs here are short domain labels.
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (curr[j - 1] ?? 0) + 1,
        (prev[j] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost
      );
    }
    prev = curr;
  }
  return prev[b.length] ?? 99;
}

/** Fold digit-for-letter swaps so amaz0n → amazon, paypa1 → paypal. */
function deLeet(s: string): string {
  return s
    .replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
    .replace(/8/g, 'b').replace(/\$/g, 's').replace(/-/g, '');
}

/** Which brand, if any, this domain is imitating without being it. */
function detectLookalike(host: string): string | null {
  const domain = registrableDomain(host);
  if (KNOWN_GOOD_DOMAINS.has(domain)) return null;

  const label = domain.split('.')[0] ?? '';
  const deLeeted = deLeet(label);

  for (const brand of BRANDS) {
    for (const good of brand.domains) {
      const goodLabel = good.split('.')[0] ?? '';
      if (goodLabel.length < 4) continue;

      // Digit/hyphen substitution that resolves to the brand exactly.
      if (deLeeted === goodLabel && label !== goodLabel) return brand.name;
      // One or two character edits away from the brand.
      const dist = levenshtein(deLeeted, goodLabel);
      if (dist > 0 && dist <= (goodLabel.length >= 8 ? 2 : 1)) return brand.name;
      // Brand embedded in a longer domain: amazon-security-alert.xyz
      if (
        label !== goodLabel &&
        new RegExp(`(?:^|[-.])${goodLabel}(?:[-.]|$)`).test(label) &&
        !KNOWN_GOOD_DOMAINS.has(domain)
      ) {
        return brand.name;
      }
    }
  }
  return null;
}

/** Brand name appearing in a subdomain of somebody else's domain. */
function detectSubdomainSpoof(host: string): string | null {
  const domain = registrableDomain(host);
  if (KNOWN_GOOD_DOMAINS.has(domain)) return null;
  const prefix = host.slice(0, Math.max(0, host.length - domain.length));
  if (!prefix) return null;
  const deLeeted = deLeet(prefix);
  for (const brand of BRANDS) {
    for (const good of brand.domains) {
      const goodLabel = good.split('.')[0] ?? '';
      if (goodLabel.length < 4) continue;
      if (deLeeted.includes(goodLabel)) return brand.name;
    }
  }
  return null;
}

interface ExtractResult {
  findings: UrlFinding[];
  matches: SignalMatch[];
}

/**
 * Domains written with non-Latin lookalike characters.
 *
 * This runs on the UNFOLDED text on purpose. Confusable folding turns the
 * Cyrillic "раypal.com" into the genuine "paypal.com", so by the time the main
 * scan sees it the impersonation is invisible — it would be credited as the
 * real brand's domain. Any domain containing non-ASCII letters is suspect:
 * legitimate internationalized domains reach the wire as punycode (xn--...),
 * not as raw Cyrillic in a text message.
 */
const NON_ASCII_DOMAIN_RE =
  /\b(?:https?:\/\/)?[^\s/<>"'`]*[^\x00-\x7f][^\s/<>"'`]*\.(?:[a-z]{2,24})\b/gi;

function detectHomoglyphDomains(text: NormalizedText): SignalMatch[] {
  if (!text.hadConfusables && text.nonAsciiRatio === 0) return [];

  const matches: SignalMatch[] = [];
  const seen = new Set<string>();

  NON_ASCII_DOMAIN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = NON_ASCII_DOMAIN_RE.exec(text.unfolded)) !== null) {
    const raw = m[0].replace(/[.,;:!?)\]]+$/, '');
    // Only care about tokens that actually contain a non-ASCII *letter*.
    if (!/[^\x00-\x7f]/.test(raw)) continue;
    if (seen.has(raw)) continue;
    seen.add(raw);

    // What does it resolve to once the lookalike characters are folded away?
    const foldedHost = parseHost(
      [...raw].map((ch) => CONFUSABLE_FOLD[ch] ?? ch).join('')
    );
    const imitating = foldedHost ? detectLookalike(foldedHost) : null;
    const pretendingToBe =
      imitating ??
      (foldedHost && KNOWN_GOOD_DOMAINS.has(registrableDomain(foldedHost))
        ? registrableDomain(foldedHost)
        : null);

    matches.push({
      flag: 'lookalike_domain',
      evidence: clipEvidence(raw),
      index: m.index,
      detail: pretendingToBe
        ? `this web address is written with lookalike foreign letters so it appears to be ${pretendingToBe}, but it is a different website entirely`
        : 'this web address uses lookalike foreign letters to disguise where it really goes',
    });
  }

  return matches;
}

/** The same confusable table the normalizer uses, for local re-folding. */
const CONFUSABLE_FOLD: Record<string, string> = {
  а: 'a', в: 'b', с: 'c', е: 'e', н: 'h', к: 'k', м: 'm', о: 'o',
  р: 'p', ѕ: 's', т: 't', у: 'y', х: 'x', і: 'i', ј: 'j',
  α: 'a', β: 'b', ε: 'e', ι: 'i', κ: 'k', ο: 'o', ρ: 'p', τ: 't', υ: 'u', χ: 'x',
};

export function detectLinks(text: NormalizedText): ExtractResult {
  const findings: UrlFinding[] = [];
  const matches: SignalMatch[] = [...detectHomoglyphDomains(text)];
  const seenHosts = new Set<string>();
  const source = text.matchable;

  // 1. Anchor-style links first, so we can catch display/href mismatch.
  const labelled: Array<{ shown: string; href: string; index: number }> = [];

  MARKDOWN_LINK_RE.lastIndex = 0;
  let md: RegExpExecArray | null;
  while ((md = MARKDOWN_LINK_RE.exec(source)) !== null) {
    labelled.push({ shown: md[1] ?? '', href: md[2] ?? '', index: md.index });
  }

  HTML_LINK_RE.lastIndex = 0;
  let html: RegExpExecArray | null;
  while ((html = HTML_LINK_RE.exec(source)) !== null) {
    labelled.push({ shown: html[2] ?? '', href: html[1] ?? '', index: html.index });
  }

  const mismatchByHref = new Map<string, { shown: string; actual: string }>();
  for (const { shown, href, index } of labelled) {
    const shownHost = parseHost(shown.trim());
    const actualHost = parseHost(href);
    if (!actualHost) continue;
    // A mismatch only counts when the visible text is *itself* a domain that
    // differs from where the link actually goes. "Click here" is not a lie.
    if (shownHost && registrableDomain(shownHost) !== registrableDomain(actualHost)) {
      const pair = { shown: shownHost, actual: actualHost };
      mismatchByHref.set(actualHost, pair);
      matches.push({
        flag: 'link_text_mismatch',
        evidence: clipEvidence(`${shownHost} → ${actualHost}`),
        index,
        detail: `the link says ${shownHost} but actually goes to ${actualHost}`,
      });
    }
  }

  // 2. Every URL in the text, anchor or bare.
  URL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(source)) !== null) {
    const raw = m[0].replace(/[.,;:!?)\]]+$/, '');

    // Skip the domain half of an email address. "someone@gmail.com" is not a
    // link to Google, and crediting it as a genuine brand domain would inflate
    // the legitimacy signals for any message that merely mentions an address.
    if (m.index > 0 && source[m.index - 1] === '@') continue;

    const host = parseHost(raw);
    if (!host) continue;
    if (seenHosts.has(host)) continue;
    seenHosts.add(host);

    const domain = registrableDomain(host);
    const ipLiteral = isIpLiteral(host);
    const shortener = SHORTENERS.has(domain);
    const tld = domain.split('.').pop() ?? '';
    const suspiciousTld = SUSPICIOUS_TLDS.has(tld) ? tld : null;

    // If this host only looks legitimate *because* confusable characters were
    // folded away, it is an impersonation, not the real brand. Verifying the
    // host appears verbatim in the unfolded text is what separates the two.
    const isGenuineSpelling = text.unfolded.includes(host);
    const homoglyphDisguised = !isGenuineSpelling;

    const lookalike = ipLiteral ? null : detectLookalike(host);
    const spoof = ipLiteral ? null : detectSubdomainSpoof(host);
    const subdomainDepth = Math.max(
      0,
      host.split('.').length - domain.split('.').length
    );

    findings.push({
      raw: clipEvidence(raw, 120),
      host,
      registrableDomain: domain,
      isShortener: shortener,
      isIpLiteral: ipLiteral,
      lookalikeOf:
        lookalike ??
        spoof ??
        (homoglyphDisguised && KNOWN_GOOD_DOMAINS.has(domain) ? domain : null),
      suspiciousTld,
      subdomainDepth,
      displayTextMismatch: mismatchByHref.get(host) ?? null,
    });

    const push = (flag: FlagId, detail: string) =>
      matches.push({ flag, evidence: clipEvidence(host), index: m!.index, detail });

    if (shortener) {
      push('url_shortener', `${domain} is a link shortener, so the real destination is hidden until you tap it`);
    }
    if (ipLiteral) {
      push('ip_address_url', 'the link points at a bare IP address instead of a domain name');
    }
    if (lookalike) {
      push('lookalike_domain', `${host} is styled to look like ${lookalike} but is not their real website`);
    } else if (spoof) {
      push('deep_subdomain_spoof', `${host} puts "${spoof}" in front of an unrelated domain (${domain}) to look official`);
    }
    if (suspiciousTld && !KNOWN_GOOD_DOMAINS.has(domain)) {
      push('suspicious_tld', `.${suspiciousTld} is a domain ending rarely used by real companies and common in scams`);
    }
    // Only credit a brand domain when it was actually spelled that way. A
    // homoglyph-disguised host is already flagged by detectHomoglyphDomains().
    if (KNOWN_GOOD_DOMAINS.has(domain) && isGenuineSpelling) {
      push('recognized_brand_domain', `${domain} is the genuine domain for this brand`);
    }
  }

  return { findings, matches };
}

export const __testing = { registrableDomain, detectLookalike, detectSubdomainSpoof, levenshtein };
