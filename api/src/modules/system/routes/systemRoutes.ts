import { FastifyInstance } from 'fastify';
import { systemController } from '../controllers/systemController';

export async function systemRoutes(fastify: FastifyInstance) {
  // Get system settings
  fastify.get('/api/system/settings', systemController.getSettings);
  
  // Update system settings
  fastify.put('/api/system/settings', systemController.updateSettings);
}
