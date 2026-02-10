import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

export class TransactionService {
  constructor(
    private prisma: PrismaClient,
    private io: SocketIOServer
  ) {}

  async getAllTransactions() {
    return await this.prisma.transaction.findMany({
      include: {
        wristband: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTransaction(wristbandId: string, productId: string, quantity: number, totalPrice: number) {
    const transaction = await this.prisma.transaction.create({
      data: {
        wristbandId,
        productId,
        quantity,
        totalPrice,
      },
      include: {
        wristband: true,
        product: true,
      },
    });

    this.io.emit('transaction:created', transaction);
    return transaction;
  }

  async deleteTransaction(id: string) {
    const transaction = await this.prisma.transaction.delete({
      where: { id },
      include: {
        wristband: true,
        product: true,
      },
    });

    this.io.emit('transaction:deleted', transaction);
    return transaction;
  }
}
