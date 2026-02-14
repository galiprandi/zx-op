import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DashboardStats {
  todayRevenue: number;
  topProducts: Array<{
    productId: string;
    name: string;
    category: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  waitingCount: number;
}

export interface PerformanceMetrics {
  averageWaitTime: number; // seconds
  averagePlayTime: number; // seconds
  totalCompletedSessions: number;
  dailyOccupancyRate: number; // percentage
  totalPlayTimeConsumed: number; // seconds today
  peakOccupancy: number;
  averageSessionDuration: number; // seconds
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get today's date range (start of day to end of day)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get today's revenue from transactions
    const todayRevenueResult = await prisma.transaction.aggregate({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      _sum: {
        totalPrice: true,
      },
    });

    const todayRevenue = Number(todayRevenueResult._sum.totalPrice || 0);

    // Get top 4 products by quantity sold today (include revenue)
    const topProductsResult = await prisma.transaction.groupBy({
      by: ['productId'],
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 4,
    });

    // Get product details for top products
    const productIds = topProductsResult.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        category: true,
      },
    });

    // Combine product details with quantities
    const topProducts = topProductsResult.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        name: product?.name || 'Unknown',
        category: product?.category || 'Unknown',
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: Number(item._sum.totalPrice || 0),
      };
    });

    // Get waiting count: sessions with remaining time but never activated
    // For now, use a simpler approach for waiting count
    const allSessions = await prisma.playerSession.findMany({
      where: {
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

    const finalWaitingCount = allSessions.filter(session => 
      session.totalAllowedSeconds > session.accumulatedSeconds
    ).length;

    return {
      todayRevenue,
      topProducts,
      waitingCount: finalWaitingCount,
    };
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    throw error;
  }
}

export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  try {
    // Get today's date range in UTC for PostgreSQL compatibility
    const today = new Date();
    const startOfDayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const endOfDayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));

    // Get all sessions from today
    const todaySessions = await prisma.playerSession.findMany({
      where: {
        createdAt: {
          gte: startOfDayUTC,
          lt: endOfDayUTC,
        },
      },
      select: {
        id: true,
        createdAt: true,
        lastStartAt: true,
        updatedAt: true,
        totalAllowedSeconds: true,
        accumulatedSeconds: true,
        isActive: true,
      },
    });

    // Calculate average wait time - include both waiting and activated sessions
    const waitingSessions = todaySessions.filter(session => 
      session.lastStartAt === null && session.accumulatedSeconds === 0 && session.totalAllowedSeconds > 0
    );
    const activatedSessions = todaySessions.filter(session => session.lastStartAt !== null);
    
    // Calculate wait time for waiting sessions (time since creation)
    const waitingTimes = waitingSessions.map(session => {
      const waitTime = (Date.now() - session.createdAt.getTime()) / 1000;
      return Math.max(0, waitTime);
    });
    
    // Calculate wait time for activated sessions (time from creation to first activation)
    const activatedWaitTimes = activatedSessions.map(session => {
      const waitTime = (session.lastStartAt!.getTime() - session.createdAt.getTime()) / 1000;
      return Math.max(0, waitTime);
    });
    
    // Combine all wait times
    const allWaitTimes = [...waitingTimes, ...activatedWaitTimes];
    const averageWaitTime = allWaitTimes.length > 0 ? 
      Math.round(allWaitTimes.reduce((sum, time) => sum + time, 0) / allWaitTimes.length) : 0;

    // Calculate play time metrics - only for sessions that actually played
    const sessionsWithTime = todaySessions.filter(s => s.accumulatedSeconds > 0);
    const totalAccumulated = todaySessions.reduce((sum, s) => sum + (s.accumulatedSeconds || 0), 0);
    
    // Calculate peak occupancy - maximum concurrent active sessions today
    const currentlyActiveSessions = todaySessions.filter(s => s.isActive);
    // For now, use current active sessions as peak (can be enhanced with time-based tracking)
    const peakOccupancy = Math.max(currentlyActiveSessions.length, 1); // At least 1 if there were sessions

    // Calculate completed sessions - sessions that have used most of their time
    const completedSessions = todaySessions.filter(session => {
      const usagePercentage = session.totalAllowedSeconds > 0 ? session.accumulatedSeconds / session.totalAllowedSeconds : 0;
      return session.totalAllowedSeconds > 0 && usagePercentage >= 0.9; // Consider 90%+ as completed
    });
    
    // Calculate daily occupancy rate - based on completed sessions vs total capacity
    const maxOccupancy = 8; // This should come from system settings
    const totalCapacityToday = maxOccupancy * 24; // Total capacity hours in a day
    const actualUsageHours = totalAccumulated / 3600; // Convert seconds to hours
    const dailyOccupancyRate = totalCapacityToday > 0 ? Math.round((actualUsageHours / totalCapacityToday) * 100) : 0;

    return {
      averageWaitTime,
      averagePlayTime: sessionsWithTime.length > 0 ? Math.round(totalAccumulated / sessionsWithTime.length) : 0,
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
