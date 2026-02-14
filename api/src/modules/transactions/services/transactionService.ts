import { PrismaClient, Transaction } from '@prisma/client';

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
}

export const transactionService = new TransactionService();
