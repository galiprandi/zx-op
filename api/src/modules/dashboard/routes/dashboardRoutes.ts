import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getDashboardStats, getPerformanceMetrics } from '../services/dashboardService';

const prisma = new PrismaClient();

export async function dashboardRoutes(fastify: FastifyInstance) {
  // Get dashboard statistics
  fastify.get('/api/dashboard/stats', async (request, reply) => {
    try {
      const stats = await getDashboardStats();
      return reply.send(stats);
    } catch (error) {
      fastify.log.error({ error }, 'Error fetching dashboard stats');
      return reply.status(500).send({ 
        error: 'Failed to fetch dashboard statistics' 
      });
    }
  });

  // Get performance metrics
  fastify.get('/api/dashboard/performance', async (request, reply) => {
    try {
      const metrics = await getPerformanceMetrics();
      return reply.send(metrics);
    } catch (error) {
      fastify.log.error({ error }, 'Error fetching performance metrics');
      return reply.status(500).send({ 
        error: 'Failed to fetch performance metrics' 
      });
    }
  });

  // Debug endpoint for performance metrics validation
  fastify.get('/api/dashboard/performance/debug', async (request, reply) => {
    try {
      const today = new Date();
      const startOfDayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const endOfDayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));

      const allSessions = await prisma.playerSession.findMany({
        where: {
          createdAt: {
            gte: startOfDayUTC,
            lt: endOfDayUTC,
          },
        },
        select: {
          id: true,
          barcodeId: true,
          createdAt: true,
          lastStartAt: true,
          updatedAt: true,
          totalAllowedSeconds: true,
          accumulatedSeconds: true,
          isActive: true,
        },
      });

      // Breakdown calculations
      const waitingSessions = allSessions.filter(s => 
        s.lastStartAt === null && s.accumulatedSeconds === 0 && s.totalAllowedSeconds > 0
      );
      const activatedSessions = allSessions.filter(s => s.lastStartAt !== null);
      const currentlyActiveSessions = allSessions.filter(s => s.isActive);
      const sessionsWithTime = allSessions.filter(s => s.accumulatedSeconds > 0);
      const totalAccumulated = allSessions.reduce((sum, s) => sum + (s.accumulatedSeconds || 0), 0);

      // Wait times
      const waitingTimes = waitingSessions.map(s => (Date.now() - s.createdAt.getTime()) / 1000);
      const activatedWaitTimes = activatedSessions.map(s => (s.lastStartAt!.getTime() - s.createdAt.getTime()) / 1000);
      const allWaitTimes = [...waitingTimes, ...activatedWaitTimes];
      const averageWaitTime = allWaitTimes.length > 0 ? 
        Math.round(allWaitTimes.reduce((sum, time) => sum + time, 0) / allWaitTimes.length) : 0;

      return reply.send({
        summary: {
          totalSessions: allSessions.length,
          waitingSessions: waitingSessions.length,
          activatedSessions: activatedSessions.length,
          currentlyActiveSessions: currentlyActiveSessions.length,
          sessionsWithTime: sessionsWithTime.length,
          totalAccumulated,
        },
        calculations: {
          averageWaitTime,
          averagePlayTime: sessionsWithTime.length > 0 ? Math.round(totalAccumulated / sessionsWithTime.length) : 0,
          totalPlayTimeConsumed: totalAccumulated,
          peakOccupancy: Math.max(currentlyActiveSessions.length, sessionsWithTime.length, waitingSessions.length),
        },
        sessions: allSessions.map(s => ({
          barcodeId: s.barcodeId,
          isActive: s.isActive,
          accumulatedSeconds: s.accumulatedSeconds,
          waitingTime: s.lastStartAt === null ? (Date.now() - s.createdAt.getTime()) / 1000 : null,
        }))
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error in performance debug');
      return reply.status(500).send({ error: 'Debug failed' });
    }
  });
}
