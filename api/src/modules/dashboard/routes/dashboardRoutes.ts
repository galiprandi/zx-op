import { FastifyInstance } from 'fastify';
import { getDashboardStats } from '../services/dashboardService';

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
}
