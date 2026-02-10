import { FastifyRequest, FastifyReply } from 'fastify';
import { SessionService } from '../services/sessionService';

export class SessionController {
  constructor(private sessionService: SessionService) {}

  async getSessions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const sessions = await this.sessionService.getAllSessions();
      return sessions;
    } catch (error) {
      reply.status(500).send({ error: 'Error fetching sessions' });
    }
  }

  async createSession(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wristbandId, purchasedMinutes } = request.body as {
        wristbandId: string;
        purchasedMinutes: number;
      };

      const session = await this.sessionService.createSession(wristbandId, purchasedMinutes);
      return session;
    } catch (error) {
      reply.status(400).send({ error: 'Error creating session' });
    }
  }

  async startSession(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const session = await this.sessionService.startSession(id);
      return session;
    } catch (error) {
      reply.status(400).send({ error: 'Error starting session' });
    }
  }

  async pauseSession(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const session = await this.sessionService.pauseSession(id);
      return session;
    } catch (error) {
      reply.status(400).send({ error: 'Error pausing session' });
    }
  }

  async endSession(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const session = await this.sessionService.endSession(id);
      return session;
    } catch (error) {
      reply.status(400).send({ error: 'Error ending session' });
    }
  }

  async deleteSession(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const session = await this.sessionService.deleteSession(id);
      return session;
    } catch (error) {
      reply.status(400).send({ error: 'Error deleting session' });
    }
  }
}
