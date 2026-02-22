import { PrismaClient, Transaction } from '@prisma/client';
import { playerSessionService } from '../../playerSessions/services/playerSessionService';
import { emitSessionEvent, emitTransactionEvent } from '../../playerSessions/services/socketService';
import type { SessionWithRemaining } from '../../playerSessions/services/playerSessionService';

const prisma = new PrismaClient();

export interface CheckinRequest {
  barcodeId: string;
  products: { id: string; quantity: number }[];
  paymentAllocations: { paymentMethodId: string; amount: number }[];
}

export interface CheckinResult {
  playerSession: SessionWithRemaining;
  transactions: Transaction[];
  totalSecondsAdded: number;
}

const MONEY_SCALE = 100;

function toMoneyCents(value: number): number {
  return Math.round(value * MONEY_SCALE);
}

export class CheckinService {
  async processCheckin(request: CheckinRequest): Promise<CheckinResult> {
    const { barcodeId, products, paymentAllocations } = request;
    if (!paymentAllocations || paymentAllocations.length === 0) {
      throw new Error('At least one payment allocation is required');
    }
    if (paymentAllocations.some((allocation) => !Number.isInteger(allocation.amount) || allocation.amount <= 0)) {
      throw new Error('Payment allocations must use positive integer amounts');
    }

    // 1. Buscar/crear PlayerSession por barcodeId
    const session = await playerSessionService.getOrCreateSession(barcodeId);
    let totalSecondsToAdd = 0;

    const productIds = products.map((item) => item.id);
    const productCatalog = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isDeleted: false,
      },
    });

    const catalogMap = new Map(productCatalog.map((product) => [product.id, product]));
    for (const item of products) {
      if (!catalogMap.has(item.id)) {
        throw new Error(`Product not found: ${item.id}`);
      }
    }

    const paymentMethodIds = paymentAllocations.map((allocation) => allocation.paymentMethodId);
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        id: { in: paymentMethodIds },
        isDeleted: false,
        isActive: true,
      },
    });
    if (paymentMethods.length !== paymentMethodIds.length) {
      throw new Error('One or more payment methods are invalid, inactive, or deleted');
    }

    const totalPrice = products.reduce((sum, item) => {
      const product = catalogMap.get(item.id)!;
      return sum + product.price * item.quantity;
    }, 0);
    const allocationsTotal = paymentAllocations.reduce((sum, item) => sum + item.amount, 0);
    if (toMoneyCents(totalPrice) !== toMoneyCents(allocationsTotal)) {
      throw new Error('Payment allocation total must match cart total');
    }

    const transactions = await prisma.$transaction(async (tx) => {
      const sale = await tx.checkinSale.create({
        data: {
          playerSessionId: session.id,
          barcodeIdSnapshot: barcodeId,
          totalAmount: totalPrice,
        },
      });

      const createdTransactions: Transaction[] = [];
      for (const item of products) {
        const product = catalogMap.get(item.id)!;
        const transaction = await tx.transaction.create({
          data: {
            playerSessionId: session.id,
            checkinSaleId: sale.id,
            productId: item.id,
            quantity: item.quantity,
            totalPrice: product.price * item.quantity,
          },
        });

        createdTransactions.push(transaction);
        if (product.timeValueSeconds !== null) {
          totalSecondsToAdd += product.timeValueSeconds * item.quantity;
        }
      }

      await tx.checkinSalePaymentAllocation.createMany({
        data: paymentAllocations.map((allocation) => ({
          checkinSaleId: sale.id,
          paymentMethodId: allocation.paymentMethodId,
          amount: allocation.amount,
        })),
      });

      return createdTransactions;
    });

    if (totalSecondsToAdd > 0) {
      await playerSessionService.addTime(barcodeId, totalSecondsToAdd);
    }

    // 6. Emitir eventos Socket.IO
    emitSessionEvent('session:updated', {
      barcodeId,
      playerSession: await playerSessionService.getStatus(barcodeId),
      timeAdded: totalSecondsToAdd,
    });

    // Emitir evento de transacción por cada una creada
    transactions.forEach(tx => {
      emitTransactionEvent('transaction:created', { transaction: tx });
    });

    return {
      playerSession: await playerSessionService.getStatus(barcodeId),
      transactions,
      totalSecondsAdded: totalSecondsToAdd,
    };
  }

  async getCheckinHistory(barcodeId: string, limit = 10) {
    const session = await prisma.playerSession.findUnique({ 
      where: { barcodeId } 
    });
    
    if (!session) {
      return [];
    }

    return prisma.transaction.findMany({
      where: { playerSessionId: session.id },
      include: { 
        product: true,
        playerSession: true 
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const checkinService = new CheckinService();
