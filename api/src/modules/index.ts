/**
 * Module Registry - Central point for all API modules
 * 
 * This file registers all modules and their routes for the Fastify server.
 * It replaces the old architecture with the new PlayerSession-based system.
 */

import { FastifyInstance } from 'fastify';

// Import new modules
import { playerSessionRoutes } from './playerSessions/routes/playerSessionRoutes';
import { checkinRoutes } from './checkin/routes/checkinRoutes';
import { productRoutes } from './products/routes/productRoutes';
import { transactionRoutes } from './transactions/routes/transactionRoutes';
import { dashboardRoutes } from './dashboard/routes/dashboardRoutes';
import { initializeSocketIO } from './playerSessions/services/socketService';

/**
 * Register all module routes with the Fastify server
 * and initialize Socket.IO for real-time events
 */
export async function registerModules(app: FastifyInstance) {
  app.log.info('Registering API modules...');

  // Initialize Socket.IO first (needed for real-time events)
  initializeSocketIO(app.server);

  // Register module routes
  await app.register(playerSessionRoutes);
  app.log.info('PlayerSessions module registered');

  await app.register(checkinRoutes);
  app.log.info('Checkin module registered');

  await app.register(productRoutes);
  app.log.info('Products module registered');

  await app.register(transactionRoutes);
  app.log.info('Transactions module registered');

  await app.register(dashboardRoutes);
  app.log.info('Dashboard module registered');

  app.log.info('All modules registered successfully');
}

/**
 * Module information for debugging and monitoring
 */
export const moduleInfo = {
  modules: [
    {
      name: 'playerSessions',
      description: 'Core time tracking and session management',
      routes: [
        'POST /api/sessions/play',
        'POST /api/sessions/pause',
        'GET /api/sessions/status/:barcodeId',
        'GET /api/sessions/active'
      ],
      dependencies: ['socketIO']
    },
    {
      name: 'checkin',
      description: 'Check-in processing and transaction creation',
      routes: [
        'POST /api/checkin',
        'GET /api/checkin/history/:barcodeId'
      ],
      dependencies: ['playerSessions', 'socketIO']
    },
    {
      name: 'products',
      description: 'Product management with time value support',
      routes: [
        'GET /api/products',
        'GET /api/products/:id',
        'POST /api/products',
        'PUT /api/products/:id',
        'DELETE /api/products/:id',
        'GET /api/products/category/:category',
        'GET /api/products/time'
      ],
      dependencies: ['socketIO']
    },
    {
      name: 'transactions',
      description: 'Transaction management and analytics',
      routes: [
        'GET /api/transactions',
        'GET /api/transactions/:id',
        'GET /api/transactions/player/:playerSessionId',
        'GET /api/transactions/barcode/:barcodeId',
        'POST /api/transactions',
        'GET /api/transactions/daterange',
        'GET /api/transactions/stats'
      ],
      dependencies: ['socketIO']
    },
    {
      name: 'dashboard',
      description: 'Dashboard statistics and monitoring',
      routes: [
        'GET /api/dashboard/stats'
      ],
      dependencies: ['transactions', 'playerSessions']
    }
  ],
  removedModules: [
    {
      name: 'sessions',
      reason: 'Replaced by playerSessions with new time tracking model'
    },
    {
      name: 'wristbands',
      reason: 'Absorbed into PlayerSession model via barcodeId'
    },
    {
      name: 'events',
      reason: 'Replaced by SessionLog within PlayerSession'
    }
  ]
};

export default registerModules;
