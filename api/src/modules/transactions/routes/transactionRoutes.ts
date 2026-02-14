import { FastifyInstance } from 'fastify';
import { transactionController } from '../controllers/transactionController';

export async function transactionRoutes(fastify: FastifyInstance) {
  // Get all transactions
  fastify.get('/api/transactions', transactionController.getAllTransactions);
  
  // Get transaction by ID
  fastify.get('/api/transactions/:id', transactionController.getTransactionById);
  
  // Get transactions by player session ID
  fastify.get('/api/transactions/player/:playerSessionId', transactionController.getTransactionsByPlayerSession);
  
  // Get transactions by barcode ID
  fastify.get('/api/transactions/barcode/:barcodeId', transactionController.getTransactionsByBarcodeId);
}
