import { FastifyInstance } from 'fastify';
import { checkinController } from '../controllers/checkinController';

export async function checkinRoutes(fastify: FastifyInstance) {
  // Process checkin - create transactions and add time
  fastify.post('/api/checkin', checkinController.processCheckin);
  
  // Get checkin history for a specific barcode
  fastify.get('/api/checkin/history/:barcodeId', checkinController.getHistory);
}
