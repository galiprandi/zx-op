import { FastifyInstance } from 'fastify';
import { getDashboardStats, getPerformanceDebugData, getPerformanceMetrics } from '../services/dashboardService';

export async function dashboardRoutes(fastify: FastifyInstance) {
  // Get dashboard statistics
  fastify.get('/api/dashboard/stats', async (request, reply) => {
    try {
      const stats = await getDashboardStats();
      return reply.send(stats);
    } catch (error) {
      fastify.log.error({ error }, 'Error fetching dashboard stats');
      return reply.status(500).send({ 
        error: 'Failed to fetch dashboard statistics' 
      });
    }
  });

  // Get performance metrics
  fastify.get('/api/dashboard/performance', async (request, reply) => {
    try {
      const metrics = await getPerformanceMetrics();
      return reply.send(metrics);
    } catch (error) {
      fastify.log.error({ error }, 'Error fetching performance metrics');
      return reply.status(500).send({ 
        error: 'Failed to fetch performance metrics' 
      });
    }
  });

  // Debug endpoint for performance metrics validation
  fastify.get('/api/dashboard/performance/debug', async (request, reply) => {
    try {
      const debugData = await getPerformanceDebugData();
      return reply.send(debugData);
    } catch (error) {
      fastify.log.error({ error }, 'Error in performance debug');
      return reply.status(500).send({ error: 'Debug failed' });
    }
  });
}
