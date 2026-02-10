import { FastifyInstance } from 'fastify';
import { WristbandController } from '../controllers/wristbandController';

export async function wristbandRoutes(fastify: FastifyInstance, controller: WristbandController) {
  // Get all wristbands
  fastify.get('/api/wristbands', controller.getWristbands.bind(controller));

  // Create wristband
  fastify.post('/api/wristbands', controller.createWristband.bind(controller));

  // Update wristband
  fastify.put('/api/wristbands/:id', controller.updateWristband.bind(controller));

  // Delete wristband
  fastify.delete('/api/wristbands/:id', controller.deleteWristband.bind(controller));
}
