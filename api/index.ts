/**
 * Vercel serverless entry point.
 *
 * Vercel serves `public/` statically from its CDN and routes everything else
 * here (see vercel.json). We reuse the same Fastify app the local server
 * builds, so routing, validation and error shapes cannot drift between the
 * two deployment targets.
 *
 * The app is built once at module scope. Vercel keeps a warm instance alive
 * between requests, so this pays Fastify's startup cost on cold start only —
 * and it is what lets the verdict cache and rate-limit counters survive
 * between requests at all.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildServer } from '../src/server.js';

const app = buildServer({ serveStatic: false });

// Kick off readiness at module scope, but attach a catch immediately: an
// unhandled rejection here would take down the whole cold start before any
// request could report the error. The rejection is re-surfaced per request.
let readyError: unknown = null;
// Promise.resolve() because Fastify's ready() returns FastifyInstance &
// PromiseLike, which has .then but not .catch.
const ready = Promise.resolve(app.ready()).catch((err: unknown) => {
  readyError = err;
});

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  await ready;

  if (readyError) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'server_unavailable',
        message: 'The checker is starting up or misconfigured. Please try again shortly.',
      })
    );
    return;
  }

  try {
    app.server.emit('request', req, res);
  } catch (err) {
    // A synchronous throw out of the emit would otherwise become an uncaught
    // exception and kill the instance rather than failing this one request.
    app.log.error(
      { err: err instanceof Error ? err.message : String(err) },
      'request dispatch failed'
    );
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'check_failed', message: 'Something went wrong.' }));
    }
  }
}
