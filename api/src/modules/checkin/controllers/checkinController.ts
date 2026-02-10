import { FastifyRequest, FastifyReply } from 'fastify';
import { CheckinService } from '../services/checkinService';

export class CheckinController {
  constructor(private checkinService: CheckinService) {}

  async processCheckin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wristbandCode, products, transactionNumber } = request.body as {
        wristbandCode: string;
        products: { id: string; quantity: number }[];
        transactionNumber?: string;
      };

      const result = await this.checkinService.processCheckin(wristbandCode, products, transactionNumber);
      return result;
    } catch (error) {
      console.error('Error creating checkin:', error);
      reply.status(500).send({
        error: 'Error creating checkin',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
