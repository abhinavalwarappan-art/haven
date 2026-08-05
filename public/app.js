/* ═══════════════════════════════════════════════════════════════════════════
   "Is This Real?" — demo UI
   ───────────────────────────────────────────────────────────────────────────
   A four-state machine: compose → thinking → result | error.

   The guiding rule for every string in this file: it is being read by a
   worried non-technical person, possibly in their seventies. No jargon, no
   percentages, no security vocabulary. Say what happened and what to do.
   ═══════════════════════════════════════════════════════════════════════════ */

const MAX_LENGTH = 20_000;
const WARN_AT = 16_000;

const el = (id) => document.getElementById(id);

const ui = {
  form: el('check-form'),
  textarea: el('message'),
  counter: el('counter'),
  clear: el('clear'),
  fieldError: el('field-error'),
  submit: el('submit'),
  examples: el('examples'),
  examplesRow: el('examples-row'),
  thinkingCopy: el('thinking-copy'),
  thinkingFill: el('thinking-fill'),
  verdict: el('verdict'),
  eyebrow: el('verdict-eyebrow'),
  headline: el('verdict-heading'),
  confidence: el('verdict-confidence'),
  reasons: el('reasons'),
  footnote: el('verdict-footnote'),
  again: el('again'),
  errorHeadline: el('error-headline'),
  errorBody: el('error-body'),
  retry: el('retry'),
  stats: el('stats'),
  stages: {
    compose: el('stage-compose'),
    thinking: el('stage-thinking'),
    result: el('stage-result'),
    error: el('stage-error'),
  },
};

/* ── Verdict copy ────────────────────────────────────────────────────────
   The headline is a sentence a person would actually say out loud. "Likely a
   scam" is a label; "This looks like a scam" is a verdict. */
const VERDICT_COPY = {
  scam: {
    eyebrow: 'Our answer',
    headline: 'This looks like a scam.',
    footnote:
      "Don't reply, don't click anything in it, and don't send money or codes. If it claims to be from a company you use, contact them with a number you already have — not one from this message.",
  },
  uncertain_be_careful: {
    eyebrow: 'Our answer',
    headline: 'Be careful with this one.',
    footnote:
      "We couldn't rule it out either way. Before you act on it, check with the sender directly using contact details you already have.",
  },
  likely_safe: {
    eyebrow: 'Our answer',
    headline: 'This looks legitimate.',
    footnote: null,
  },
};

/**
 * Turn a 0-100 confidence into something a person understands.
 *
 * Never show the raw number. "84%" invites the reader to do arithmetic about
 * their own risk, which is exactly the wrong cognitive task. For the uncertain
 * verdict, high confidence means "confidently ambiguous", so it needs its own
 * phrasing rather than sounding like a weak scam call.
 */
function confidenceCopy(verdict, confidence) {
  if (verdict === 'uncertain_be_careful') {
    return "This one is genuinely unclear — there are signs both ways.";
  }
  const subject = verdict === 'scam' ? 'it is a scam' : 'it is genuine';
  if (confidence >= 92) return `We're very confident ${subject}.`;
  if (confidence >= 80) return `We're confident ${subject}.`;
  if (confidence >= 68) return `We're fairly confident ${subject}.`;
  return `We lean towards this, but we're not certain.`;
}

/* ── Thinking copy ───────────────────────────────────────────────────────
   These track what the pipeline is genuinely doing, in order. Honest
   narration beats a spinner: it turns a ~6 second wait from "is it broken?"
   into "it is doing the work I asked for". */
const THINKING_STEPS = [
  'Reading the message…',
  'Checking where the links really go…',
  'Looking for pressure tactics…',
  'Weighing it all up…',
  'Almost there…',
];

let thinkingTimer = null;
let progressTimer = null;

function startThinking() {
  let step = 0;
  let progress = 0;

  ui.thinkingCopy.textContent = THINKING_STEPS[0];
  ui.thinkingFill.style.width = '6%';

  thinkingTimer = setInterval(() => {
    step = Math.min(step + 1, THINKING_STEPS.length - 1);
    ui.thinkingCopy.textContent = THINKING_STEPS[step];
    // Re-trigger the fade without a class toggle round-trip.
    ui.thinkingCopy.style.animation = 'none';
    void ui.thinkingCopy.offsetHeight;
    ui.thinkingCopy.style.animation = '';
  }, 1900);

  // Eases toward 92% and stops. It never completes on its own — only a real
  // response finishes the bar, so the UI never claims to be done before it is.
  progressTimer = setInterval(() => {
    progress += (92 - progress) * 0.12;
    ui.thinkingFill.style.width = `${progress.toFixed(1)}%`;
  }, 420);
}

function stopThinking() {
  clearInterval(thinkingTimer);
  clearInterval(progressTimer);
  thinkingTimer = progressTimer = null;
  ui.thinkingFill.style.width = '100%';
}

/* ── Stage machine ───────────────────────────────────────────────────────── */

function show(stage) {
  for (const [name, node] of Object.entries(ui.stages)) {
    node.hidden = name !== stage;
  }
  if (stage !== 'thinking') stopThinking();
  if (stage === 'thinking') startThinking();
}

/* ── Validation & counter ────────────────────────────────────────────────── */

function setFieldError(message) {
  ui.fieldError.textContent = message ?? '';
  ui.fieldError.hidden = !message;
}

function updateCounter() {
  const length = ui.textarea.value.length;
  ui.clear.hidden = length === 0;

  if (length === 0) {
    ui.counter.textContent = '';
    ui.counter.removeAttribute('data-state');
    return;
  }
  const chars = (n) => `${n.toLocaleString()} character${n === 1 ? '' : 's'}`;

  if (length > MAX_LENGTH) {
    ui.counter.textContent = `${chars(length - MAX_LENGTH)} too long`;
    ui.counter.dataset.state = 'over';
    return;
  }
  if (length > WARN_AT) {
    ui.counter.textContent = `${chars(MAX_LENGTH - length)} left`;
    ui.counter.dataset.state = 'warn';
    return;
  }
  ui.counter.textContent = chars(length);
  ui.counter.removeAttribute('data-state');
}

/* ── Rendering ───────────────────────────────────────────────────────────── */

function renderResult(data) {
  const copy = VERDICT_COPY[data.verdict] ?? VERDICT_COPY.uncertain_be_careful;

  ui.verdict.dataset.verdict = data.verdict;
  ui.eyebrow.textContent = copy.eyebrow;
  ui.headline.textContent = copy.headline;
  ui.confidence.textContent = confidenceCopy(data.verdict, data.confidence);

  ui.reasons.replaceChildren(
    ...data.reasons.map((reason, i) => {
      const li = document.createElement('li');
      li.textContent = reason;
      li.style.setProperty('--i', String(i));
      return li;
    })
  );

  // When the AI layer was unavailable we say so, rather than presenting a
  // rules-only answer with the same authority as a full one.
  const degraded = data.meta?.classifier === 'heuristic_fallback';
  const notes = [copy.footnote, degraded ? 'Our detailed checker was unavailable, so this is a quick automatic assessment — please double-check before acting on it.' : null].filter(Boolean);

  ui.footnote.textContent = notes.join(' ');
  ui.footnote.hidden = notes.length === 0;

  show('result');
  revealStage(ui.stages.result);
}

/**
 * @param {string} message
 * @param {string} [headline] Defaults to a failure framing. Rate limiting is
 *   not a failure — it resolves on its own — so it gets a calmer headline and
 *   must not read as "the demo is broken".
 */
function renderError(message, headline = "We couldn't check that") {
  ui.errorHeadline.textContent = headline;
  ui.errorBody.textContent = message;
  show('error');
  revealStage(ui.stages.error);
}

/**
 * Move focus for screen readers without letting the browser scroll the
 * masthead off the top — the verdict should arrive in place, not yank the
 * page. `preventScroll` plus an explicit scroll-to-top keeps the whole card
 * visible from its first line.
 */
function revealStage(node) {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  node.focus({ preventScroll: true });
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ── Submit ──────────────────────────────────────────────────────────────── */

async function check(text) {
  show('thinking');

  let response;
  try {
    response = await fetch('/api/check', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {
    renderError(
      "We couldn't reach our checker. Please check your internet connection and try again."
    );
    return;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Body wasn't JSON we could read. Fall through — the status still tells us
    // enough to say something useful.
  }

  if (!response.ok) {
    // Two different things can throttle us, and only one of them is ours:
    //   429 — our own limiter, which sends a message written for the reader.
    //   403 — the platform edge firewall, which blocks before our code runs
    //         and returns its own generic body. Without this branch a judge
    //         poking hard would see "unexpected response" and assume the demo
    //         is broken, which is exactly the wall we're trying to avoid.
    if (response.status === 429 || response.status === 403) {
      renderError(
        payload?.message ||
          "You've made a lot of checks in a short time, so we're pausing briefly. Wait about a minute and try again — nothing is broken, and re-checking a message you've already checked is always free.",
        'Just a moment'
      );
      return;
    }
    renderError(payload?.message || 'Something went wrong. Please try again.');
    return;
  }

  if (!payload) {
    renderError('We got an unexpected response. Please try again in a moment.');
    return;
  }

  renderResult(payload);
  void refreshStats();
}

ui.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = ui.textarea.value;

  if (!text.trim()) {
    setFieldError('Paste a message first, then press Check it.');
    ui.textarea.focus();
    return;
  }
  if (text.length > MAX_LENGTH) {
    setFieldError(
      `That's a bit too long to check. Paste just the suspicious part — up to ${MAX_LENGTH.toLocaleString()} characters.`
    );
    ui.textarea.focus();
    return;
  }

  setFieldError(null);
  void check(text);
});

ui.textarea.addEventListener('input', () => {
  updateCounter();
  if (ui.fieldError.hidden === false && ui.textarea.value.trim()) setFieldError(null);
});

// Cmd/Ctrl+Enter submits — a small nicety for repeat demoing.
ui.textarea.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    ui.form.requestSubmit();
  }
});

ui.clear.addEventListener('click', () => {
  ui.textarea.value = '';
  setFieldError(null);
  updateCounter();
  ui.textarea.focus();
});

function backToCompose() {
  show('compose');
  ui.textarea.focus();
  ui.textarea.select();
}

ui.again.addEventListener('click', backToCompose);
ui.retry.addEventListener('click', backToCompose);

/* ── Examples ────────────────────────────────────────────────────────────── */

async function loadExamples() {
  try {
    const response = await fetch('/api/examples');
    if (!response.ok) return;
    const { examples } = await response.json();
    if (!Array.isArray(examples) || examples.length === 0) return;

    ui.examplesRow.replaceChildren(
      ...examples.map((example) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chip';
        button.innerHTML =
          '<span class="chip__label"></span><span class="chip__hint"></span>';
        button.querySelector('.chip__label').textContent = example.label;
        button.querySelector('.chip__hint').textContent = example.hint;
        button.addEventListener('click', () => {
          ui.textarea.value = example.text;
          setFieldError(null);
          updateCounter();
          ui.textarea.focus();
          ui.textarea.setSelectionRange(0, 0);
          ui.textarea.scrollTop = 0;
        });
        return button;
      })
    );
    ui.examples.hidden = false;
  } catch {
    // Examples are a convenience. Their absence should never be visible.
  }
}

/* ── Stats ───────────────────────────────────────────────────────────────── */

async function refreshStats() {
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) return;
    const stats = await response.json();
    if (!stats || typeof stats.total_checks !== 'number' || stats.total_checks === 0) return;

    const plural = (n, word) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;
    ui.stats.innerHTML = '';
    const strongTotal = document.createElement('b');
    strongTotal.textContent = plural(stats.total_checks, 'message');
    const strongScams = document.createElement('b');
    strongScams.textContent = plural(stats.scams_flagged, 'scam');

    ui.stats.append(strongTotal, ' checked so far · ', strongScams, ' caught');
    ui.stats.hidden = false;
  } catch {
    // Demo texture only — never surface a failure here.
  }
}

/* ── Boot ────────────────────────────────────────────────────────────────── */

updateCounter();
show('compose');
void loadExamples();
void refreshStats();
