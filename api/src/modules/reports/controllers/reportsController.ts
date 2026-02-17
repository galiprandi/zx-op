import { FastifyReply, FastifyRequest } from 'fastify';
import { getReportsSummary } from '../services/reportsService';

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
}

export const reportsController = new ReportsController();
