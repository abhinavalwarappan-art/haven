/**
 * POST /api/check — the main endpoint.
 *
 * Input:  { "text": "<pasted message>" }
 * Output: { verdict, confidence, reasons, flags_detected, raw_signals, meta }
 */

import type { FastifyInstance } from 'fastify';
import {
  InvalidInputError,
  MAX_INPUT_LENGTH,
  runCheck,
  validateInput,
} from '../lib/pipeline.js';
import { hashExact } from '../lib/privacy.js';
import { cacheHas } from '../lib/cache.js';
import { clientIdFrom, consume, rateLimitConfig } from '../lib/rate-limit.js';

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

    let text: string;
    try {
      // Validate before rate limiting so malformed requests get the useful
      // error rather than being counted against a quota they never used.
      text = validateInput(body.text);
    } catch (err) {
      if (err instanceof InvalidInputError) {
        return reply.status(400).send({
          error: err.code,
          message: err.message,
          ...(err.code === 'too_long' ? { max_length: MAX_INPUT_LENGTH } : {}),
        });
      }
      throw err;
    }

    // Only spend quota on requests that will actually do paid work. A repeat
    // check of an already-classified message is served from cache for free,
    // so re-running a demo example never eats into anyone's allowance.
    if (!cacheHas(hashExact(text))) {
      const decision = consume(
        clientIdFrom(request.headers as Record<string, unknown>, request.ip)
      );

      if (!decision.allowed) {
        reply.header('retry-after', String(decision.retryAfterSeconds));
        return reply.status(429).send({
          error: decision.global ? 'busy' : 'rate_limited',
          // Written for the person, not the client library. Someone poking at
          // a live demo should understand what happened and that it will pass.
          message: decision.global
            ? `We're getting a lot of checks right now. Please try again in about ${decision.retryAfterSeconds} seconds — nothing is broken.`
            : `That's a lot of checks in a short time. Please wait about ${decision.retryAfterSeconds} seconds and try again — re-checking a message you've already checked is always free.`,
          retry_after_seconds: decision.retryAfterSeconds,
        });
      }
      reply.header('x-ratelimit-limit', String(decision.limit));
      reply.header('x-ratelimit-remaining', String(decision.remaining));
    }

    try {
      const result = await runCheck(text);
      return reply.status(200).send(result);
    } catch (err) {
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

  app.get('/api/limits', async (_request, reply) => reply.send(rateLimitConfig()));
}
