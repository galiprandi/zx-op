import 'dotenv/config';
import fs from 'fs';
import fastify from 'fastify';
import cors from '@fastify/cors';
import { registerModules } from './modules';

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
  https: {
    key: fs.readFileSync('../ui/certs/key.pem'),
    cert: fs.readFileSync('../ui/certs/cert.pem')
  }
});

async function main() {
  await app.register(cors, { origin: '*' });

  // Register all API modules (this replaces all the direct route implementations)
  await registerModules(app);

  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  
  await app.listen({ port, host });
  app.log.info(`API ready on http://${host}:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
