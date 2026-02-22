import { FastifyReply, FastifyRequest } from 'fastify';
import {
  CreatePaymentMethodRequest,
  paymentMethodService,
  UpdatePaymentMethodRequest,
} from '../services/paymentMethodService';

export class PaymentMethodController {
  async getActive(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const methods = await paymentMethodService.getActiveMethods();
      return reply.send(methods);
    } catch (error) {
      console.error('Get active payment methods error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getAdmin(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const methods = await paymentMethodService.getAllForAdmin();
      return reply.send(methods);
    } catch (error) {
      console.error('Get payment methods admin error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as CreatePaymentMethodRequest;
      if (!body?.name || typeof body.name !== 'string') {
        return reply.status(400).send({ error: 'name is required' });
      }

      const method = await paymentMethodService.createMethod(body);
      return reply.send(method);
    } catch (error) {
      console.error('Create payment method error:', error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as UpdatePaymentMethodRequest;
      if (!body?.name || typeof body.name !== 'string') {
        return reply.status(400).send({ error: 'name is required' });
      }

      const method = await paymentMethodService.updateMethod(id, body);
      return reply.send(method);
    } catch (error) {
      console.error('Update payment method error:', error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async softDelete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const method = await paymentMethodService.softDeleteMethod(id);
      return reply.send(method);
    } catch (error) {
      console.error('Delete payment method error:', error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async toggleActive(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const method = await paymentMethodService.toggleActive(id);
      return reply.send(method);
    } catch (error) {
      console.error('Toggle payment method status error:', error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}

export const paymentMethodController = new PaymentMethodController();
