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
const ready = app.ready();

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  await ready;
  app.server.emit('request', req, res);
}
