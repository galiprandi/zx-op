import { FastifyInstance } from 'fastify';
import { playerSessionController } from '../controllers/playerSessionController';

export async function playerSessionRoutes(fastify: FastifyInstance) {
  // Play session
  fastify.post('/api/sessions/play', playerSessionController.play);
  
  // Pause session
  fastify.post('/api/sessions/pause', playerSessionController.pause);

  // Register lap during active play
  fastify.post('/api/sessions/lap', playerSessionController.registerLap);
  
  // Get session status
  fastify.get('/api/sessions/status/:barcodeId', playerSessionController.getStatus);
  
  // Get all active sessions
  fastify.get('/api/sessions/active', playerSessionController.getAllActive);
}
