import { FastifyRequest, FastifyReply } from 'fastify';
import { systemService } from '../services/systemService';

export class SystemController {
  async getSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const settings = await systemService.getSettings();
      return settings;
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(500).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async updateSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { maxOccupancy } = request.body as { maxOccupancy?: number };
      const settings = await systemService.updateSettings(maxOccupancy);
      return settings;
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}

export const systemController = new SystemController();
