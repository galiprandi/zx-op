import { FastifyRequest, FastifyReply } from 'fastify';
import { EventService } from '../services/eventService';

export class EventController {
  constructor(private eventService: EventService) {}

  async getEvents(request: FastifyRequest, reply: FastifyReply) {
    try {
      const events = await this.eventService.getAllEvents();
      return events;
    } catch (error) {
      reply.status(500).send({ error: 'Error fetching events' });
    }
  }

  async createEvent(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { sessionId, type, data } = request.body as {
        sessionId: string;
        type: string;
        data?: unknown;
      };

      const event = await this.eventService.createEvent(sessionId, type as any, data);
      return event;
    } catch (error) {
      reply.status(400).send({ error: 'Error creating event' });
    }
  }

  async deleteEvent(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const event = await this.eventService.deleteEvent(id);
      return event;
    } catch (error) {
      reply.status(400).send({ error: 'Error deleting event' });
    }
  }
}
