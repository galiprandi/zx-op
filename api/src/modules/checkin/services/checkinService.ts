import { PrismaClient, Transaction } from '@prisma/client';
import { playerSessionService } from '../../playerSessions/services/playerSessionService';
import { emitSessionEvent, emitTransactionEvent } from '../../playerSessions/services/socketService';
import type { SessionWithRemaining } from '../../playerSessions/services/playerSessionService';

const prisma = new PrismaClient();

export interface CheckinRequest {
  barcodeId: string;
  products: { id: string; quantity: number }[];
}

export interface CheckinResult {
  playerSession: SessionWithRemaining;
  transactions: Transaction[];
  totalSecondsAdded: number;
}

export class CheckinService {
  async processCheckin(request: CheckinRequest): Promise<CheckinResult> {
    const { barcodeId, products } = request;

    // 1. Buscar/crear PlayerSession por barcodeId
    const session = await playerSessionService.getOrCreateSession(barcodeId);

    let totalSecondsToAdd = 0;
    const transactions: Transaction[] = [];

    // 2. Procesar cada producto
    for (const item of products) {
      const product = await prisma.product.findUnique({ where: { id: item.id } });
      
      if (!product || product.isDeleted) {
        throw new Error(`Product not found: ${item.id}`);
      }

      // 3. Crear transacción
      const transaction = await prisma.transaction.create({
        data: {
          playerSessionId: session.id,
          productId: item.id,
          quantity: item.quantity,
          totalPrice: product.price * item.quantity,
        },
      });
      
      transactions.push(transaction);

      // 4. Si es producto de tiempo, acumular segundos
      if (product.timeValueSeconds !== null) {
        totalSecondsToAdd += product.timeValueSeconds * item.quantity;
      }
    }

    // 5. Agregar tiempo si hay productos de tiempo
    if (totalSecondsToAdd > 0) {
      await playerSessionService.addTime(barcodeId, totalSecondsToAdd);
    }

    // 6. Emitir eventos Socket.IO
    emitSessionEvent('session:updated', { 
      barcodeId, 
      session: await playerSessionService.getStatus(barcodeId),
      timeAdded: totalSecondsToAdd 
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
