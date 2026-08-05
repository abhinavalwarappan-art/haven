/**
 * Fastify API server.
 *
 * All the real work lives in src/lib/, so this file stays a thin HTTP shell —
 * which is also what makes the pipeline testable without a server and portable
 * to Next.js route handlers later.
 */

import Fastify from 'fastify';
import { registerCheckRoute } from './routes/check.js';
import { registerStatsRoute } from './routes/stats.js';
import { getStore } from './store/index.js';
import { hasApiKey, classifierModel } from './lib/classifier.js';
import { isUsingDefaultSalt } from './lib/privacy.js';

const PORT = Number(process.env.PORT || 3600);
const HOST = process.env.HOST || '0.0.0.0';

export function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      // Pasted messages must never reach the logs.
      redact: {
        paths: ['req.body.text', 'req.body', 'body'],
        censor: '[redacted]',
      },
    },
    bodyLimit: 1_000_000,
  });

  // Permissive CORS: this API is public and holds no user data or sessions.
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (request.method === 'OPTIONS') reply.status(204).send();
  });

  app.get('/health', async () => ({
    ok: true,
    store: getStore().kind,
    classifier: hasApiKey() ? classifierModel() : 'unavailable (no API key)',
  }));

  registerCheckRoute(app);
  registerStatsRoute(app);

  return app;
}

async function main() {
  const app = buildServer();

  if (!hasApiKey()) {
    app.log.warn(
      'ANTHROPIC_API_KEY is not set — every check will use the rules-only fallback.'
    );
  }
  if (isUsingDefaultSalt()) {
    app.log.warn('HASH_SALT is still the default placeholder. Set it before deploying.');
  }

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`store=${getStore().kind} model=${classifierModel()}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Only auto-start when run directly, so tests can import buildServer freely.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop() ?? '')) {
  void main();
}
