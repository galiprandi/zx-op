import { FastifyRequest, FastifyReply } from 'fastify';
import { WristbandService } from '../services/wristbandService';

export class WristbandController {
  constructor(private wristbandService: WristbandService) {}

  async getWristbands(request: FastifyRequest, reply: FastifyReply) {
    try {
      const wristbands = await this.wristbandService.getAllWristbands();
      return wristbands;
    } catch (error) {
      reply.status(500).send({ error: 'Error fetching wristbands' });
    }
  }

  async createWristband(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { qrCode, userId } = request.body as { qrCode: string; userId?: string };
      
      if (!qrCode) {
        return reply.status(400).send({ error: 'qrCode is required' });
      }

      const wristband = await this.wristbandService.createWristband(qrCode, userId);
      return wristband;
    } catch (error) {
      console.error('Error creating wristband:', error);
      reply.status(400).send({
        error: 'Error creating wristband',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateWristband(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { userId } = request.body as { userId?: string };

      const wristband = await this.wristbandService.updateWristband(id, userId);
      return wristband;
    } catch (error) {
      reply.status(400).send({ error: 'Error updating wristband' });
    }
  }

  async deleteWristband(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const wristband = await this.wristbandService.deleteWristband(id);
      return wristband;
    } catch (error) {
      reply.status(400).send({ error: 'Error deleting wristband' });
    }
  }
}
