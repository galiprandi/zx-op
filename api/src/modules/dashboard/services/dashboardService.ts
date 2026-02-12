import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DashboardStats {
  todayRevenue: number;
  topProducts: Array<{
    productId: string;
    name: string;
    category: string;
    totalQuantity: number;
  }>;
  waitingCount: number;
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

    const todayRevenue = todayRevenueResult._sum.totalPrice || 0;

    // Get top 4 products by quantity sold today
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
