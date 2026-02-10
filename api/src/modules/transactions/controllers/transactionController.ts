import { FastifyRequest, FastifyReply } from 'fastify';
import { TransactionService } from '../services/transactionService';

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  async getTransactions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const transactions = await this.transactionService.getAllTransactions();
      return transactions;
    } catch (error) {
      reply.status(500).send({ error: 'Error fetching transactions' });
    }
  }

  async createTransaction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wristbandId, productId, quantity, totalPrice } = request.body as {
        wristbandId: string;
        productId: string;
        quantity: number;
        totalPrice: number;
      };

      const transaction = await this.transactionService.createTransaction(wristbandId, productId, quantity, totalPrice);
      return transaction;
    } catch (error) {
      reply.status(400).send({ error: 'Error creating transaction' });
    }
  }

  async deleteTransaction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const transaction = await this.transactionService.deleteTransaction(id);
      return transaction;
    } catch (error) {
      reply.status(400).send({ error: 'Error deleting transaction' });
    }
  }
}
