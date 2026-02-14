import { FastifyRequest, FastifyReply } from 'fastify';
import { transactionService } from '../services/transactionService';

export class TransactionController {
  async getAllTransactions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { limit } = request.query as { limit?: string };
      const limitNum = limit ? parseInt(limit, 10) : 50;
      
      if (isNaN(limitNum) || limitNum <= 0 || limitNum > 200) {
        return reply.status(400).send({ error: 'Invalid limit. Must be between 1 and 200' });
      }

      const transactions = await transactionService.getAllTransactions(limitNum);
      return transactions;
    } catch (error) {
      console.error('Get transactions error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getTransactionById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const transaction = await transactionService.getTransactionById(id);
      
      if (!transaction) {
        return reply.status(404).send({ error: 'Transaction not found' });
      }
      
      return transaction;
    } catch (error) {
      console.error('Get transaction error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getTransactionsByPlayerSession(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { playerSessionId } = request.params as { playerSessionId: string };
      const { limit } = request.query as { limit?: string };
      const limitNum = limit ? parseInt(limit, 10) : 20;
      
      if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
        return reply.status(400).send({ error: 'Invalid limit. Must be between 1 and 100' });
      }

      const transactions = await transactionService.getTransactionsByPlayerSession(playerSessionId, limitNum);
      return transactions;
    } catch (error) {
      console.error('Get transactions by player session error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getTransactionsByBarcodeId(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { barcodeId } = request.params as { barcodeId: string };
      const { limit } = request.query as { limit?: string };
      const limitNum = limit ? parseInt(limit, 10) : 20;
      
      if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
        return reply.status(400).send({ error: 'Invalid limit. Must be between 1 and 100' });
      }

      const transactions = await transactionService.getTransactionsByBarcodeId(barcodeId, limitNum);
      return transactions;
    } catch (error) {
      console.error('Get transactions by barcode error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}

export const transactionController = new TransactionController();
