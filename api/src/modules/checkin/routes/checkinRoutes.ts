import { FastifyInstance } from 'fastify';
import { CheckinController } from '../controllers/checkinController';

export async function checkinRoutes(fastify: FastifyInstance, controller: CheckinController) {
  // Process checkin
  fastify.post('/api/checkin', controller.processCheckin.bind(controller));
}
