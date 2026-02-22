import { FastifyInstance } from 'fastify';
import { paymentMethodController } from '../controllers/paymentMethodController';

export async function paymentMethodRoutes(fastify: FastifyInstance) {
  fastify.get('/api/payment-methods', paymentMethodController.getActive);
  fastify.get('/api/payment-methods/admin', paymentMethodController.getAdmin);
  fastify.post('/api/payment-methods', paymentMethodController.create);
  fastify.put('/api/payment-methods/:id', paymentMethodController.update);
  fastify.delete('/api/payment-methods/:id', paymentMethodController.softDelete);
  fastify.patch('/api/payment-methods/:id/toggle-active', paymentMethodController.toggleActive);
}
