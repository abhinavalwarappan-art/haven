/**
 * GET /api/stats — running counters for the demo.
 *
 * Aggregates only. No individual check is ever exposed here.
 */

import type { FastifyInstance } from 'fastify';
import { getStore } from '../store/index.js';

export function registerStatsRoute(app: FastifyInstance): void {
  app.get('/api/stats', async (request, reply) => {
    try {
      const stats = await getStore().getStats();
      return reply.status(200).send(stats);
    } catch (err) {
      request.log.error(
        { err: err instanceof Error ? err.message : String(err) },
        'stats query failed'
      );
      return reply.status(500).send({
        error: 'stats_unavailable',
        message: 'Could not load stats right now.',
      });
    }
  });
}
