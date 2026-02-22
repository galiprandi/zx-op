import { FastifyRequest, FastifyReply } from 'fastify';
import { systemService } from '../services/systemService';
import { emitSystemEvent } from '../../playerSessions/services/socketService';

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
      const { maxOccupancy, siteName, logoUrl, operationalDayStart, timezone, autoExpireGraceMinutes } = request.body as {
        maxOccupancy?: number;
        siteName?: string;
        logoUrl?: string | null;
        operationalDayStart?: string;
        timezone?: string;
        autoExpireGraceMinutes?: number;
      };
      const settings = await systemService.updateSettings(
        maxOccupancy,
        siteName,
        logoUrl,
        operationalDayStart,
        timezone,
        autoExpireGraceMinutes,
      );
      emitSystemEvent('system:settings-updated', { settings });
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
