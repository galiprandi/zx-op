import { FastifyInstance } from 'fastify';
import { TransactionController } from '../controllers/transactionController';

export async function transactionRoutes(fastify: FastifyInstance, controller: TransactionController) {
  // Get all transactions
  fastify.get('/api/transactions', controller.getTransactions.bind(controller));

  // Create transaction
  fastify.post('/api/transactions', controller.createTransaction.bind(controller));

  // Delete transaction
  fastify.delete('/api/transactions/:id', controller.deleteTransaction.bind(controller));
}
