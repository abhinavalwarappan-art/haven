import { Link } from 'react-router-dom';

import { LegalDoc, type Clause } from '../components/LegalDoc';
import { PageShell } from '../components/PageShell';

/* ═══════════════════════════════════════════════════════════════════════════
   Terms of service.
   ───────────────────────────────────────────────────────────────────────────
   The important clause is the second one. A scam checker that lets someone
   believe its "looks legitimate" is a guarantee has done more harm than one
   that never existed, so the limit on what an answer means is stated early and
   in the same plain words the tool itself uses.
   ═══════════════════════════════════════════════════════════════════════════ */

const CLAUSES: Clause[] = [
  {
    heading: 'What Haven is',
    body: (
      <p>
        Haven reads a message you paste in and tells you whether it looks like a
        scam, with the reasons behind that answer. It is free, needs no account,
        and is offered as it is. It is an independent student project rather
        than a company or a commercial service.
      </p>
    ),
  },
  {
    heading: 'What an answer means, and what it does not',
    body: (
      <>
        <p>
          Every answer is a second opinion, not a guarantee. Haven can be wrong
          in both directions: it can call a real message a scam, and it can miss
          a scam that is well built.
        </p>
        <p>
          "This looks legitimate" is not permission to send money, click a link,
          share a code, or hand over card or account details. When money or
          personal information is involved, verify independently before acting:
          call the company on a number you already have, from a statement or the
          back of your card, and never a number or link inside the message you
          are asking about.
        </p>
        <p>
          Nothing here is legal, financial, or security advice, and using Haven
          creates no professional relationship of any kind.
        </p>
      </>
    ),
  },
  {
    heading: 'Fair use',
    body: (
      <>
        <p>
          Please use Haven for checking messages you have actually received or
          been sent. Do not use it to test or refine scam messages, to attack
          the service, or to run automated traffic through it at volume.
        </p>
        <p>
          Requests are rate limited per visitor to keep the service up for
          everyone. Hitting that limit is a short pause, not a penalty, and it
          clears on its own within about a minute.
        </p>
      </>
    ),
  },
  {
    heading: 'What you paste',
    body: (
      <p>
        You keep whatever rights you have in the text you paste. We claim none
        of it, and we do not store it. Where that text goes while it is being
        checked is set out in the{' '}
        <Link to="/privacy-policy">privacy policy</Link>, and it is worth
        reading before you paste anything sensitive.
      </p>
    ),
  },
  {
    heading: 'Availability',
    body: (
      <p>
        There is no uptime promise. The service may be slow, unavailable, or
        withdrawn without notice. When the model behind the second pass is
        unreachable, Haven falls back to its offline rules and says on the page
        that only one layer ran, so a partial answer is never presented as a
        complete one.
      </p>
    ),
  },
  {
    heading: 'Liability',
    body: (
      <p>
        Haven is provided without warranties of any kind, to the fullest extent
        the law allows. Decisions you make after reading an answer are yours.
        Nothing in these terms limits any liability that cannot legally be
        limited.
      </p>
    ),
  },
  {
    heading: 'Changes',
    body: (
      <p>
        These terms may change as the project does. The date at the top of this
        page moves whenever they do, and continuing to use Haven means the
        current version applies.
      </p>
    ),
  },
  {
    heading: 'Related',
    body: (
      <p>
        What happens to what you paste is on the{' '}
        <Link to="/privacy">privacy page</Link> and, in full, in the{' '}
        <Link to="/privacy-policy">privacy policy</Link>. How the checking
        actually works is on <Link to="/how-it-works">how it works</Link>.
      </p>
    ),
  },
];

export function Terms() {
  return (
    <PageShell
      name="legal"
      eyebrow="Terms of service"
      title="What this is, and what it is not."
      lede="Short, and worth reading the second clause of. An answer here is a second opinion, never a guarantee, and the difference matters most on the day you most want it to be certain."
    >
      <LegalDoc updated="7 August 2026" clauses={CLAUSES} />
    </PageShell>
  );
}
