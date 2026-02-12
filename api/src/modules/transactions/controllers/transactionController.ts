import { FastifyRequest, FastifyReply } from 'fastify';
import { transactionService, CreateTransactionRequest } from '../services/transactionService';

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

  async createTransaction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as CreateTransactionRequest;
      
      // Validaciones
      if (!body.playerSessionId || typeof body.playerSessionId !== 'string') {
        return reply.status(400).send({ error: 'playerSessionId is required' });
      }
      
      if (!body.productId || typeof body.productId !== 'string') {
        return reply.status(400).send({ error: 'productId is required' });
      }
      
      if (typeof body.quantity !== 'number' || body.quantity <= 0) {
        return reply.status(400).send({ error: 'quantity must be a positive number' });
      }
      
      if (typeof body.totalPrice !== 'number' || body.totalPrice <= 0) {
        return reply.status(400).send({ error: 'totalPrice must be a positive number' });
      }

      const transaction = await transactionService.createTransaction(body);
      return transaction;
    } catch (error) {
      console.error('Create transaction error:', error);
      
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getTransactionsByDateRange(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };
      
      if (!startDate || !endDate) {
        return reply.status(400).send({ error: 'startDate and endDate are required' });
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return reply.status(400).send({ error: 'Invalid date format' });
      }
      
      if (start > end) {
        return reply.status(400).send({ error: 'startDate must be before endDate' });
      }

      const transactions = await transactionService.getTransactionsByDateRange(start, end);
      return transactions;
    } catch (error) {
      console.error('Get transactions by date range error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getTransactionStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };
      
      let start: Date | undefined;
      let end: Date | undefined;
      
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
          return reply.status(400).send({ error: 'Invalid date range' });
        }
      }
      
      const stats = await transactionService.getTransactionStats(start, end);
      return stats;
    } catch (error) {
      console.error('Get transaction stats error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}

export const transactionController = new TransactionController();
