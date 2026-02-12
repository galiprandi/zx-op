import { PrismaClient, Transaction } from '@prisma/client';
import { emitTransactionEvent } from '../../playerSessions/services/socketService';

const prisma = new PrismaClient();

export interface TransactionWithRelations extends Transaction {
  playerSession: {
    id: string;
    barcodeId: string;
  };
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    timeValueSeconds: number | null;
  };
}

export interface CreateTransactionRequest {
  playerSessionId: string;
  productId: string;
  quantity: number;
  totalPrice: number;
}

export class TransactionService {
  async getAllTransactions(limit = 50): Promise<TransactionWithRelations[]> {
    return prisma.transaction.findMany({
      include: {
        playerSession: {
          select: {
            id: true,
            barcodeId: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            timeValueSeconds: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getTransactionById(id: string): Promise<TransactionWithRelations | null> {
    return prisma.transaction.findFirst({
      where: { id },
      include: {
        playerSession: {
          select: {
            id: true,
            barcodeId: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            timeValueSeconds: true,
          }
        }
      },
    });
  }

  async getTransactionsByPlayerSession(playerSessionId: string, limit = 20): Promise<TransactionWithRelations[]> {
    return prisma.transaction.findMany({
      where: { playerSessionId },
      include: {
        playerSession: {
          select: {
            id: true,
            barcodeId: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            timeValueSeconds: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getTransactionsByBarcodeId(barcodeId: string, limit = 20): Promise<TransactionWithRelations[]> {
    // First find the player session by barcodeId
    const session = await prisma.playerSession.findUnique({
      where: { barcodeId },
      select: { id: true }
    });

    if (!session) {
      return [];
    }

    return this.getTransactionsByPlayerSession(session.id, limit);
  }

  async createTransaction(data: CreateTransactionRequest): Promise<TransactionWithRelations> {
    // Verify player session exists
    const session = await prisma.playerSession.findUnique({
      where: { id: data.playerSessionId }
    });

    if (!session) {
      throw new Error('Player session not found');
    }

    // Verify product exists and is not deleted
    const product = await prisma.product.findFirst({
      where: { id: data.productId, isDeleted: false }
    });

    if (!product) {
      throw new Error('Product not found or deleted');
    }

    const transaction = await prisma.transaction.create({
      data: {
        playerSessionId: data.playerSessionId,
        productId: data.productId,
        quantity: data.quantity,
        totalPrice: data.totalPrice,
      },
      include: {
        playerSession: {
          select: {
            id: true,
            barcodeId: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            timeValueSeconds: true,
          }
        }
      },
    });

    // Emit Socket.IO event
    emitTransactionEvent('transaction:created', { transaction });

    return transaction;
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<TransactionWithRelations[]> {
    return prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        playerSession: {
          select: {
            id: true,
            barcodeId: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            timeValueSeconds: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransactionStats(startDate?: Date, endDate?: Date) {
    const whereClause = startDate && endDate ? {
      createdAt: {
        gte: startDate,
        lte: endDate,
      }
    } : {};

    const [totalTransactions, totalRevenue, topProducts] = await Promise.all([
      prisma.transaction.count({ where: whereClause }),
      prisma.transaction.aggregate({
        where: whereClause,
        _sum: { totalPrice: true }
      }),
      prisma.transaction.groupBy({
        by: ['productId'],
        where: whereClause,
        _sum: { totalPrice: true },
        _count: { id: true },
        orderBy: {
          _sum: { totalPrice: 'desc' }
        },
        take: 5
      })
    ]);

    return {
      totalTransactions,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      topProducts: await Promise.all(
        topProducts.map(async (group) => {
          const product = await prisma.product.findUnique({
            where: { id: group.productId },
            select: { name: true, category: true }
          });
          return {
            ...group,
            product
          };
        })
      )
    };
  }
}

export const transactionService = new TransactionService();
