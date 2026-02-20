import { PrismaClient } from '@prisma/client';
import { getOperationalContext } from '../../system/services/operationalContextService';

const prisma = new PrismaClient();

export interface DashboardStats {
  todayRevenue: number;
  salesByCategory: Array<{
    category: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  waitingCount: number;
}

export interface PerformanceMetrics {
  averageWaitTime: number; // seconds
  averagePlayTime: number; // seconds
  averageSecondsPerLap: number | null; // weighted by total laps
  totalLaps: number;
  totalCompletedSessions: number;
  dailyOccupancyRate: number; // percentage
  totalPlayTimeConsumed: number; // seconds today
  peakOccupancy: number;
  averageSessionDuration: number; // seconds
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const { startUtc, endUtc } = await getOperationalContext();

    const todayRevenueResult = await prisma.transaction.aggregate({
      where: {
        createdAt: {
          gte: startUtc,
          lt: endUtc,
        },
      },
      _sum: {
        totalPrice: true,
      },
    });

    const todayRevenue = Number(todayRevenueResult._sum.totalPrice || 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startUtc,
          lt: endUtc,
        },
      },
      select: {
        quantity: true,
        totalPrice: true,
        product: {
          select: {
            category: true,
          },
        },
      },
    });

    const groupedByCategory = new Map<string, { totalQuantity: number; totalRevenue: number }>();
    for (const tx of transactions) {
      const category = tx.product?.category || 'unknown';
      const existing = groupedByCategory.get(category);
      if (existing) {
        existing.totalQuantity += tx.quantity;
        existing.totalRevenue += Number(tx.totalPrice || 0);
      } else {
        groupedByCategory.set(category, {
          totalQuantity: tx.quantity,
          totalRevenue: Number(tx.totalPrice || 0),
        });
      }
    }

    const salesByCategory = Array.from(groupedByCategory.entries())
      .map(([category, values]) => ({
        category,
        totalQuantity: values.totalQuantity,
        totalRevenue: values.totalRevenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const allSessions = await prisma.playerSession.findMany({
      where: {
        createdAt: {
          gte: startUtc,
          lt: endUtc,
        },
        expiresAt: {
          gt: new Date(),
        },
        lastStartAt: null,
        totalAllowedSeconds: {
          gt: 0,
        },
      },
      select: {
        id: true,
        totalAllowedSeconds: true,
        accumulatedSeconds: true,
      },
    });

    const finalWaitingCount = allSessions.filter((session) => session.totalAllowedSeconds > session.accumulatedSeconds).length;

    return {
      todayRevenue,
      salesByCategory,
      waitingCount: finalWaitingCount,
    };
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    throw error;
  }
}

export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  try {
    const { startUtc, endUtc, maxOccupancy } = await getOperationalContext();
    const nowMs = Date.now();

    const todaySessions = await prisma.playerSession.findMany({
      where: {
        createdAt: {
          gte: startUtc,
          lt: endUtc,
        },
      },
      select: {
        id: true,
        createdAt: true,
        lastStartAt: true,
        updatedAt: true,
        totalAllowedSeconds: true,
        accumulatedSeconds: true,
        lapsCount: true,
        isActive: true,
      },
    });

    const waitingSessions = todaySessions.filter(
      (session) => session.lastStartAt === null && session.accumulatedSeconds === 0 && session.totalAllowedSeconds > 0,
    );
    const activatedSessions = todaySessions.filter((session) => session.lastStartAt !== null);

    const waitingTimes = waitingSessions.map((session) => {
      const waitTime = (Date.now() - session.createdAt.getTime()) / 1000;
      return Math.max(0, waitTime);
    });

    const activatedWaitTimes = activatedSessions.map((session) => {
      const waitTime = (session.lastStartAt!.getTime() - session.createdAt.getTime()) / 1000;
      return Math.max(0, waitTime);
    });

    const allWaitTimes = [...waitingTimes, ...activatedWaitTimes];
    const averageWaitTime =
      allWaitTimes.length > 0 ? Math.round(allWaitTimes.reduce((sum, time) => sum + time, 0) / allWaitTimes.length) : 0;

    const sessionsWithTime = todaySessions.filter((s) => s.accumulatedSeconds > 0);
    const totalAccumulated = todaySessions.reduce((sum, s) => sum + (s.accumulatedSeconds || 0), 0);
    const sessionsWithLaps = todaySessions.filter((s) => s.lapsCount > 0);
    const totalLaps = sessionsWithLaps.reduce((sum, s) => sum + s.lapsCount, 0);
    const totalLapSeconds = sessionsWithLaps.reduce((sum, s) => {
      const activeSegmentSeconds =
        s.isActive && s.lastStartAt ? Math.max(0, Math.floor((nowMs - s.lastStartAt.getTime()) / 1000)) : 0;
      return sum + (s.accumulatedSeconds || 0) + activeSegmentSeconds;
    }, 0);

    const currentlyActiveSessions = todaySessions.filter((s) => s.isActive);
    const peakOccupancy = currentlyActiveSessions.length;

    const completedSessions = todaySessions.filter((session) => {
      const usagePercentage = session.totalAllowedSeconds > 0 ? session.accumulatedSeconds / session.totalAllowedSeconds : 0;
      return session.totalAllowedSeconds > 0 && usagePercentage >= 0.9;
    });

    const totalCapacityToday = maxOccupancy * 24;
    const actualUsageHours = totalAccumulated / 3600;
    const dailyOccupancyRate = totalCapacityToday > 0 ? Math.round((actualUsageHours / totalCapacityToday) * 100) : 0;

    return {
      averageWaitTime,
      averagePlayTime: sessionsWithTime.length > 0 ? Math.round(totalAccumulated / sessionsWithTime.length) : 0,
      averageSecondsPerLap: totalLaps > 0 ? Math.round(totalLapSeconds / totalLaps) : null,
      totalLaps,
      totalCompletedSessions: completedSessions.length,
      dailyOccupancyRate,
      totalPlayTimeConsumed: totalAccumulated,
      peakOccupancy,
      averageSessionDuration: sessionsWithTime.length > 0 ? Math.round(totalAccumulated / sessionsWithTime.length) : 0,
    };
  } catch (error) {
    console.error('Error in getPerformanceMetrics:', error);
    throw error;
  }
}

export async function getPerformanceDebugData() {
  const { startUtc, endUtc } = await getOperationalContext();
  const nowMs = Date.now();

  const allSessions = await prisma.playerSession.findMany({
    where: {
      createdAt: {
        gte: startUtc,
        lt: endUtc,
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
      lapsCount: true,
      isActive: true,
    },
  });

  const waitingSessions = allSessions.filter(
    (s) => s.lastStartAt === null && s.accumulatedSeconds === 0 && s.totalAllowedSeconds > 0,
  );
  const activatedSessions = allSessions.filter((s) => s.lastStartAt !== null);
  const currentlyActiveSessions = allSessions.filter((s) => s.isActive);
  const sessionsWithTime = allSessions.filter((s) => s.accumulatedSeconds > 0);
  const totalAccumulated = allSessions.reduce((sum, s) => sum + (s.accumulatedSeconds || 0), 0);
  const sessionsWithLaps = allSessions.filter((s) => s.lapsCount > 0);
  const totalLaps = sessionsWithLaps.reduce((sum, s) => sum + s.lapsCount, 0);
  const totalLapSeconds = sessionsWithLaps.reduce((sum, s) => {
    const activeSegmentSeconds =
      s.isActive && s.lastStartAt ? Math.max(0, Math.floor((nowMs - s.lastStartAt.getTime()) / 1000)) : 0;
    return sum + (s.accumulatedSeconds || 0) + activeSegmentSeconds;
  }, 0);

  const waitingTimes = waitingSessions.map((s) => (Date.now() - s.createdAt.getTime()) / 1000);
  const activatedWaitTimes = activatedSessions.map((s) => (s.lastStartAt!.getTime() - s.createdAt.getTime()) / 1000);
  const allWaitTimes = [...waitingTimes, ...activatedWaitTimes];
  const averageWaitTime =
    allWaitTimes.length > 0 ? Math.round(allWaitTimes.reduce((sum, time) => sum + time, 0) / allWaitTimes.length) : 0;

  return {
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
      averageSecondsPerLap: totalLaps > 0 ? Math.round(totalLapSeconds / totalLaps) : null,
      totalLaps,
      totalPlayTimeConsumed: totalAccumulated,
      peakOccupancy: Math.max(currentlyActiveSessions.length, sessionsWithTime.length, waitingSessions.length),
    },
    sessions: allSessions.map((s) => ({
      barcodeId: s.barcodeId,
      isActive: s.isActive,
      accumulatedSeconds: s.accumulatedSeconds,
      waitingTime: s.lastStartAt === null ? (Date.now() - s.createdAt.getTime()) / 1000 : null,
    })),
  };
}
