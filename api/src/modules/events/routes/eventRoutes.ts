import { FastifyInstance } from 'fastify';
import { EventController } from '../controllers/eventController';

export async function eventRoutes(fastify: FastifyInstance, controller: EventController) {
  // Get all events
  fastify.get('/api/events', controller.getEvents.bind(controller));

  // Create event
  fastify.post('/api/events', controller.createEvent.bind(controller));

  // Delete event
  fastify.delete('/api/events/:id', controller.deleteEvent.bind(controller));
}
