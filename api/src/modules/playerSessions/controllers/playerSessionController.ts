import { FastifyRequest, FastifyReply } from 'fastify';
import { playerSessionService } from '../services/playerSessionService';

export class PlayerSessionController {
  async play(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { barcodeId } = request.body as { barcodeId: string };
      const session = await playerSessionService.play(barcodeId);
      return session;
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async pause(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { barcodeId } = request.body as { barcodeId: string };
      const session = await playerSessionService.pause(barcodeId);
      return session;
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { barcodeId } = request.params as { barcodeId: string };
      const status = await playerSessionService.getStatus(barcodeId);
      return status;
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getAllActive(request: FastifyRequest, reply: FastifyReply) {
    try {
      const sessions = await playerSessionService.getAllActive();
      return sessions;
    } catch {
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}

export const playerSessionController = new PlayerSessionController();
