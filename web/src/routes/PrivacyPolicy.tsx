import { Link } from 'react-router-dom';

import { LegalDoc, type Clause } from '../components/LegalDoc';
import { PageShell } from '../components/PageShell';

/* ═══════════════════════════════════════════════════════════════════════════
   The formal version of /privacy.
   ───────────────────────────────────────────────────────────────────────────
   Written to match what the code actually does, clause by clause, rather than
   copied from a generator. Two things most policies of this kind quietly omit
   are stated outright here: the message text is sent to Google to be read by
   their model, and the stored fingerprints do not survive a redeploy.

   Haven is a student project, and the policy says so. Claiming to be a company
   with a data protection officer would be the first false statement on a site
   whose whole subject is telling truth from performance.
   ═══════════════════════════════════════════════════════════════════════════ */

const CLAUSES: Clause[] = [
  {
    heading: 'Who runs this',
    body: (
      <>
        <p>
          Haven is an independent student project, not a company. It is free,
          has no accounts, sells nothing, and has no commercial relationship
          with anyone. There is no business model behind it that your data
          could be useful to.
        </p>
      </>
    ),
  },
  {
    heading: 'What we collect',
    body: (
      <>
        <p>When you check a message, the following is recorded:</p>
        <ul>
          <li>
            A salted one-way hash of the message text, produced with HMAC
            SHA-256. This is a fixed-length string of characters. The original
            text cannot be recovered from it.
          </li>
          <li>The verdict, and the confidence figure behind it.</li>
          <li>
            Short labels for which rule signals fired, for example
            "lookalike_domain".
          </li>
          <li>The time of the check and how many milliseconds it took.</li>
        </ul>
        <p>
          The message you pasted is not recorded, in whole or in part. There is
          no field for it.
        </p>
        <p>
          Your IP address is held in memory only, for a few minutes, to count
          requests for rate limiting. It is never written to storage and never
          attached to a check.
        </p>
      </>
    ),
  },
  {
    heading: 'What we do not collect',
    body: (
      <>
        <p>
          No name, no email address, no phone number, no account, no password.
          No cookies are set. There is no analytics script, no advertising
          pixel, no session recording, and no device fingerprinting. Fonts and
          images are served from this site rather than a third-party network,
          so loading the page does not announce your visit to anyone else.
        </p>
      </>
    ),
  },
  {
    heading: 'Who else sees your message',
    body: (
      <>
        <p>
          This is the part that matters most, so it is stated plainly rather
          than buried.
        </p>
        <p>
          To read your message in context, Haven sends its text to Google's
          Gemini API. That means the text of what you paste leaves this site and
          is processed on Google's servers, under Google's terms and their
          handling of API data. We do not control that, and we cannot promise
          anything about it on their behalf.
        </p>
        <p>
          Before the answer is returned, full payment card numbers and Social
          Security numbers are stripped out of it on our server, so those cannot
          be echoed back over the network.
        </p>
        <p>
          The site is hosted on Vercel, which as a hosting provider processes
          the network requests needed to serve it.
        </p>
        <p>
          Nobody else receives anything. Nothing is sold, shared, rented, or
          handed to advertisers or data brokers.
        </p>
      </>
    ),
  },
  {
    heading: 'How long anything is kept',
    body: (
      <>
        <p>
          The hash and its verdict live in memory on the running server. They
          are not written to a database in the deployed version, which means
          they are lost whenever the site is redeployed or the instance is
          recycled. In practice that is hours, not years.
        </p>
        <p>
          Recently checked messages are also cached briefly so that re-checking
          the same text is instant and free. That cache is capped, holds the
          hash rather than the text, and expires on its own.
        </p>
      </>
    ),
  },
  {
    heading: 'Your rights over it',
    body: (
      <>
        <p>
          There is nothing here that identifies you, so there is no account to
          close, no profile to download, and no record we could find and delete
          on request even if you asked. That is a consequence of the design
          rather than a policy position: we avoided collecting the thing rather
          than promising to look after it.
        </p>
        <p>
          If you paste a message that happens to contain your own personal
          details, that text is still not stored by us. It is, however, sent to
          Google as described above, so the safest habit is to remove details
          you do not need checked before pasting.
        </p>
      </>
    ),
  },
  {
    heading: 'Children',
    body: (
      <p>
        Haven is not directed at children and collects nothing that would
        identify anyone, of any age.
      </p>
    ),
  },
  {
    heading: 'Changes to this policy',
    body: (
      <p>
        If what the code does changes, this page changes with it, and the date
        at the top moves. There is no mailing list to notify, because there are
        no email addresses.
      </p>
    ),
  },
  {
    heading: 'Related',
    body: (
      <p>
        The plain-language version of all of this is on the{' '}
        <Link to="/privacy">privacy page</Link>. What Haven is and is not for is
        covered in the <Link to="/terms">terms of service</Link>.
      </p>
    ),
  },
];

export function PrivacyPolicy() {
  return (
    <PageShell
      name="legal"
      eyebrow="Privacy policy"
      title="The formal version."
      lede="Everything on the privacy page, stated as clauses. It is written to match what the code does, so if the two ever disagree, the code is the bug."
    >
      <LegalDoc updated="7 August 2026" clauses={CLAUSES} />
    </PageShell>
  );
}
