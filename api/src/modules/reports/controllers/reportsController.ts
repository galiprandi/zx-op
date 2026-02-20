import { FastifyReply, FastifyRequest } from 'fastify';
import {
  getOperationalDayDetail,
  getOperationalDaysPage,
  getReportsSummary,
  isReportsNotFoundError,
} from '../services/reportsService';

export class ReportsController {
  async getSummary(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const summary = await getReportsSummary();
      return reply.send(summary);
    } catch (error) {
      console.error('Error fetching reports summary:', error);
      return reply.status(500).send({ error: 'Failed to fetch reports summary' });
    }
  }

  async getOperationalDaysPage(
    request: FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const page = request.query.page ? Number(request.query.page) : 1;
      const pageSize = request.query.pageSize ? Number(request.query.pageSize) : 15;

      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1) {
        return reply.status(400).send({ error: 'Invalid pagination params. Use positive integers.' });
      }

      const result = await getOperationalDaysPage({ page, pageSize });
      return reply.send(result);
    } catch (error) {
      console.error('Error fetching operational days page:', error);
      return reply.status(500).send({ error: 'Failed to fetch operational days page' });
    }
  }

  async getOperationalDayDetail(
    request: FastifyRequest<{ Params: { operationalDate: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const operationalDate = request.params.operationalDate;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(operationalDate)) {
        return reply.status(400).send({ error: 'Invalid operationalDate format. Use YYYY-MM-DD.' });
      }

      const result = await getOperationalDayDetail({ operationalDate });
      return reply.send(result);
    } catch (error) {
      if (isReportsNotFoundError(error)) {
        return reply.status(404).send({ error: error.message });
      }
      if (error instanceof Error && error.message.includes('Invalid operationalDate format')) {
        return reply.status(400).send({ error: error.message });
      }

      console.error('Error fetching operational day detail:', error);
      return reply.status(500).send({ error: 'Failed to fetch operational day detail' });
    }
  }
}

export const reportsController = new ReportsController();
