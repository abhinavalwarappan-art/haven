/**
 * GET /api/examples — pre-loaded messages for the demo.
 *
 * Pulled from the evaluation fixtures so there is one source of truth: what
 * judges click is literally what the test suite grades.
 *
 * Labels are deliberately neutral ("A delivery text") rather than descriptive
 * ("A scam example") — announcing the answer before the tool gives it defeats
 * the point of the demo.
 */

import type { FastifyInstance } from 'fastify';
import { FIXTURES } from '../../fixtures/messages.js';

/**
 * Chosen to tell a story in three clicks:
 *  1 & 2 look almost identical to a worried person — one is a scam, one is not.
 *      This is the "does it cry wolf?" proof.
 *  3   scores 0/100 on the rules layer (no links, no payment ask, no urgency)
 *      and is still caught. This is the "why two layers?" proof.
 */
const PICKS: Array<{ id: string; label: string; hint: string }> = [
  { id: 'scam-usps-redelivery', label: 'A delivery text', hint: 'Package on hold' },
  { id: 'legit-ups-shipping', label: 'A shipping update', hint: 'Arriving Thursday' },
  { id: 'scam-romance-wrong-number', label: 'A wrong number', hint: 'Stranger says hello' },
];

export function registerExamplesRoute(app: FastifyInstance): void {
  const examples = PICKS.map(({ id, label, hint }) => {
    const fixture = FIXTURES.find((f) => f.id === id);
    if (!fixture) throw new Error(`Example fixture "${id}" not found`);
    return { id, label, hint, text: fixture.text };
  });

  app.get('/api/examples', async (_request, reply) => reply.send({ examples }));
}
