import { FastifyInstance } from 'fastify';
import { reportsController } from '../controllers/reportsController';

export async function reportsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/reports/summary', reportsController.getSummary);
}
