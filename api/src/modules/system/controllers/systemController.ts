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
      const { maxOccupancy, siteName, logoUrl } = request.body as { 
        maxOccupancy?: number;
        siteName?: string;
        logoUrl?: string | null;
      };
      const settings = await systemService.updateSettings(maxOccupancy, siteName, logoUrl);
      return settings;
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(500).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}

export const systemController = new SystemController();
