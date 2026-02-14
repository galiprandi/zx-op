import 'dotenv/config';
import fs from 'fs';
import fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient, LogAction, Prisma, PlayerSession,  Transaction } from '@prisma/client';
import { initializeSocketIO, emitSessionEvent } from './modules/playerSessions/services/socketService';
import { getDashboardStats } from './modules/dashboard/services/dashboardService';

// Type for session with computed fields
type SessionWithRemaining = PlayerSession & {
  remainingSeconds: number;
  remainingMinutes: number;
};

const prisma = new PrismaClient();
const logger = {
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production'
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          singleLine: true,
          ignore: 'pid,hostname'
        }
      }
};

const app = fastify({
  logger,
  https: {
    key: fs.readFileSync('../ui/certs/key.pem'),
    cert: fs.readFileSync('../ui/certs/cert.pem')
  }
});

const computeRemainingSeconds = (session: { totalAllowedSeconds: number | null | undefined; accumulatedSeconds: number | null | undefined; isActive: boolean; lastStartAt: Date | null }) => {
  const now = new Date();
  const running = session.isActive && session.lastStartAt ? Math.floor((now.getTime() - session.lastStartAt.getTime()) / 1000) : 0;
  const totalAllowed = session.totalAllowedSeconds ?? 0;
  const consumedBase = session.accumulatedSeconds ?? 0;
  const consumed = consumedBase + running;
  const remaining = totalAllowed - consumed;
  return Math.max(0, Number.isFinite(remaining) ? remaining : 0);
};

const calcExpiry = (session: { totalAllowedSeconds: number; accumulatedSeconds: number; isActive: boolean; lastStartAt: Date | null }) => {
  const remaining = computeRemainingSeconds(session);
  const now = new Date();
  return remaining > 0 ? new Date(now.getTime() + remaining * 1000) : now;
};

async function logAction(playerSessionId: string, action: LogAction, data?: Prisma.InputJsonValue) {
  await prisma.sessionLog.create({ data: { playerSessionId, action, data } });
}

async function main() {
  await app.register(cors, { origin: '*' });

  // Initialize Socket.IO to broadcast session/product events
  initializeSocketIO(app.server, app.log);

  // Play session
  app.post('/api/sessions/play', async (req, reply) => {
    const { barcodeId } = req.body as { barcodeId: string };
    let session = await prisma.playerSession.findFirst({ where: { barcodeId: { equals: barcodeId, mode: 'insensitive' } } });
    if (!session) {
      session = await prisma.playerSession.create({ data: { barcodeId } });
      await logAction(session.id, LogAction.CHECKIN, { created: true });
    }
    const remaining = computeRemainingSeconds(session);
    if (remaining <= 0) return reply.status(400).send({ error: 'No remaining time' });
    if (session.isActive) return session;
    const updated = await prisma.playerSession.update({ where: { id: session.id }, data: { isActive: true, lastStartAt: new Date() } });
    await logAction(updated.id, LogAction.PLAY);
    emitSessionEvent('session:play', { barcodeId, session: updated });
    return updated;
  });

  // Pause session
  app.post('/api/sessions/pause', async (req) => {
    const { barcodeId } = req.body as { barcodeId: string };
    const session = await prisma.playerSession.findFirst({ where: { barcodeId: { equals: barcodeId, mode: 'insensitive' } } });
    if (!session) throw new Error('Session not found');
    const now = new Date();
    const extra = session.isActive && session.lastStartAt ? Math.floor((now.getTime() - session.lastStartAt.getTime()) / 1000) : 0;
    const updated = await prisma.playerSession.update({
      where: { id: session.id },
      data: { isActive: false, lastStartAt: null, accumulatedSeconds: { increment: extra } },
    });
    await logAction(updated.id, LogAction.PAUSE, { extra });
    emitSessionEvent('session:pause', { barcodeId, session: updated });
    return updated;
  });

  // Status
  app.get('/api/sessions/status/:barcodeId', async (req, reply) => {
    const { barcodeId } = req.params as { barcodeId: string };
    const session = await prisma.playerSession.findFirst({ where: { barcodeId: { equals: barcodeId, mode: 'insensitive' } } });
    if (!session) return reply.status(404).send({ error: 'Session not found' });
    let remainingSeconds = computeRemainingSeconds(session);
    let current = session;
    if (session.isActive && remainingSeconds <= 0) {
      current = await prisma.playerSession.update({ where: { id: session.id }, data: { isActive: false, lastStartAt: null, accumulatedSeconds: session.accumulatedSeconds + remainingSeconds } });
      await logAction(current.id, LogAction.AUTO_EXPIRE);
      remainingSeconds = 0;
    }
    return { ...current, remainingSeconds, remainingMinutes: Math.floor(remainingSeconds / 60) };
  });

  // Active list
  app.get('/api/sessions/active', async () => {
    const sessions = await prisma.playerSession.findMany();
    return sessions
      .map((s: PlayerSession) => {
        const remainingSeconds = computeRemainingSeconds(s);
        return { ...s, remainingSeconds, remainingMinutes: Math.floor(remainingSeconds / 60) };
      })
      .filter((s: SessionWithRemaining) => s.remainingSeconds > 0);
  });

  // Checkin
  app.post('/api/checkin', async (req) => {
    const { barcodeId, products } = req.body as { barcodeId: string; products: { id: string; quantity: number }[] };
    let session = await prisma.playerSession.findFirst({ where: { barcodeId: { equals: barcodeId, mode: 'insensitive' } } });
    if (!session) session = await prisma.playerSession.create({ data: { barcodeId } });

    let totalSecondsToAdd = 0;
    const txs: Transaction[] = [];
    for (const item of products) {
      const product = await prisma.product.findUnique({ where: { id: item.id } });
      if (!product || product.isDeleted) throw new Error('Product not found');
      const t = (product as { timeValueSeconds?: number }).timeValueSeconds ?? 0;
      totalSecondsToAdd += t * item.quantity;
      const tx = await prisma.transaction.create({
        data: {
          playerSessionId: session.id,
          productId: item.id,
          quantity: item.quantity,
          totalPrice: product.price * item.quantity,
        },
      });
      txs.push(tx);
    }

    if (totalSecondsToAdd > 0) {
      session = await prisma.playerSession.update({
        where: { id: session.id },
        data: { totalAllowedSeconds: { increment: totalSecondsToAdd } },
      });
      const expiresAt = calcExpiry(session);
      session = await prisma.playerSession.update({ where: { id: session.id }, data: { expiresAt } });
      await logAction(session.id, LogAction.TIME_ADDED, { totalSecondsToAdd });
    }

    await logAction(session.id, LogAction.CHECKIN, { products });
    return { playerSession: session, transactions: txs };
  });

  // Products
  app.get('/api/products', () => prisma.product.findMany({ where: { isDeleted: false } }));
  app.post('/api/products', async (req) => {
    const { name, description, price, category, required, timeValueSeconds } = req.body as {
      name: string;
      description?: string;
      price: number;
      category: string;
      required?: boolean;
      timeValueSeconds?: number;
    };
    return prisma.product.create({ data: { name, description, price, category, required: !!required, timeValueSeconds: timeValueSeconds ?? null } });
  });
  app.put('/api/products/:id', async (req) => {
    const { id } = req.params as { id: string };
    const { name, description, price, category, required, timeValueSeconds } = req.body as {
      name: string;
      description?: string;
      price: number;
      category: string;
      required?: boolean;
      timeValueSeconds?: number;
    };
    return prisma.product.update({ where: { id }, data: { name, description, price, category, required: !!required, timeValueSeconds: timeValueSeconds ?? null } });
  });
  app.delete('/api/products/:id', async (req) => {
    const { id } = req.params as { id: string };
    return prisma.product.update({ where: { id }, data: { isDeleted: true } });
  });

  // Transactions
  app.get('/api/transactions', () => prisma.transaction.findMany({ include: { playerSession: true, product: true }, orderBy: { createdAt: 'desc' } }));

  // System settings - occupancy
  app.get('/api/system/settings', async () => {
    const setting = await prisma.systemSetting.findUnique({ where: { id: 'system' } });
    if (setting) return setting;
    return prisma.systemSetting.create({ data: { id: 'system', maxOccupancy: 100 } });
  });

  app.put('/api/system/settings', async (req, reply) => {
    const { maxOccupancy } = req.body as { maxOccupancy?: number };
    const parsed = Number(maxOccupancy);
    if (!Number.isFinite(parsed)) {
      return reply.status(400).send({ error: 'maxOccupancy must be a number' });
    }

    const updated = await prisma.systemSetting.upsert({
      where: { id: 'system' },
      update: { maxOccupancy: parsed },
      create: { id: 'system', maxOccupancy: parsed },
    });

    return updated;
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', async () => getDashboardStats());

  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  
  await app.listen({ port, host });
  app.log.info(`API ready on http://${host}:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
