/**
 * POST /api/check — the main endpoint.
 *
 * Input:  { "text": "<pasted message>" }
 * Output: { verdict, confidence, reasons, flags_detected, raw_signals, meta }
 */

import type { FastifyInstance } from 'fastify';
import { InvalidInputError, MAX_INPUT_LENGTH, runCheck } from '../lib/pipeline.js';

interface CheckBody {
  text?: unknown;
}

export function registerCheckRoute(app: FastifyInstance): void {
  app.post<{ Body: CheckBody }>('/api/check', async (request, reply) => {
    const body = request.body;

    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      return reply.status(400).send({
        error: 'invalid_body',
        message: 'Send a JSON object shaped like { "text": "the message" }.',
      });
    }

    try {
      const result = await runCheck(body.text as string);
      return reply.status(200).send(result);
    } catch (err) {
      if (err instanceof InvalidInputError) {
        return reply.status(400).send({
          error: err.code,
          message: err.message,
          ...(err.code === 'too_long' ? { max_length: MAX_INPUT_LENGTH } : {}),
        });
      }

      // Never leak the pasted text or a stack trace to the client.
      request.log.error(
        { err: err instanceof Error ? err.message : String(err) },
        'check failed'
      );
      return reply.status(500).send({
        error: 'check_failed',
        message: 'Something went wrong checking that message. Please try again.',
      });
    }
  });
}
