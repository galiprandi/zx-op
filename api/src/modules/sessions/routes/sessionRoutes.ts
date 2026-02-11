import { FastifyInstance } from 'fastify';
import { SessionController } from '../controllers/sessionController';

export async function sessionRoutes(fastify: FastifyInstance, controller: SessionController) {
  // Get all sessions
  fastify.get('/api/sessions', controller.getSessions.bind(controller));

  // Create session
  fastify.post('/api/sessions', controller.createSession.bind(controller));

  // Start session
  fastify.put('/api/sessions/:id/start', controller.startSession.bind(controller));

  // Pause session
  fastify.put('/api/sessions/:id/pause', controller.pauseSession.bind(controller));

  // Get active session by wristband QR code
  fastify.get('/api/sessions/active/:qrCode', controller.getActiveSessionByQrCode.bind(controller));

  // Delete session
  fastify.delete('/api/sessions/:id', controller.deleteSession.bind(controller));
}
