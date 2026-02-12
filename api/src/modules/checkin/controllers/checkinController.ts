import { FastifyRequest, FastifyReply } from 'fastify';
import { checkinService, CheckinRequest } from '../services/checkinService';

export class CheckinController {
  async processCheckin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as CheckinRequest;
      
      // Validar que venga barcodeId y productos
      if (!body.barcodeId || !body.products || !Array.isArray(body.products)) {
        return reply.status(400).send({ 
          error: 'Invalid request. barcodeId and products array are required' 
        });
      }

      // Validar que cada producto tenga id y quantity
      for (const product of body.products) {
        if (!product.id || typeof product.quantity !== 'number' || product.quantity <= 0) {
          return reply.status(400).send({ 
            error: 'Invalid product format. Each product must have id and positive quantity' 
          });
        }
      }

      const result = await checkinService.processCheckin(body);
      return result;
    } catch (error) {
      console.error('Checkin error:', error);
      
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { barcodeId } = request.params as { barcodeId: string };
      const { limit } = request.query as { limit?: string };
      
      const limitNum = limit ? parseInt(limit, 10) : 10;
      
      if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
        return reply.status(400).send({ error: 'Invalid limit. Must be between 1 and 100' });
      }

      const history = await checkinService.getCheckinHistory(barcodeId, limitNum);
      return history;
    } catch (error) {
      console.error('History error:', error);
      
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}

export const checkinController = new CheckinController();
