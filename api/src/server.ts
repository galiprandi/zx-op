import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { registerModules } from './modules';

const prisma = new PrismaClient();

function loadHttpsOptions() {
  if (process.env.ENABLE_HTTPS !== 'true') {
    return undefined;
  }

  const certPath = path.resolve(process.cwd(), process.env.HTTPS_CERT_PATH ?? '../ui/certs/cert.pem');
  const keyPath = path.resolve(process.cwd(), process.env.HTTPS_KEY_PATH ?? '../ui/certs/key.pem');

  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    throw new Error(`HTTPS is enabled but certificate files were not found at ${certPath} and ${keyPath}`);
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
}

const app = fastify({
  logger: {
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
  },
  https: loadHttpsOptions()
});

async function main() {
  await app.register(cors, { origin: '*' });

  app.get('/api/health', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.send({ status: 'ok', database: 'up' });
    } catch (error) {
      app.log.error({ error }, 'Health check failed');
      return reply.status(503).send({ status: 'error', database: 'down' });
    }
  });

  // Register all API modules (this replaces all the direct route implementations)
  await registerModules(app);

  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  
  await app.listen({ port, host });
  app.log.info(`API ready on http://${host}:${port}`);
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});

app.addHook('onClose', async () => {
  await prisma.$disconnect();
});
