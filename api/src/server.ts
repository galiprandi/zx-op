import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import fastify from 'fastify';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { ModuleRegistry } from './modules';

const server = fastify({
	logger: true,
});

// Register CORS plugin (wildcard-only as requested)
await server.register(cors, {
	origin: '*',
	credentials: false,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
});

await server.register(websocket);

// Prisma client
const prisma = new PrismaClient();

// Socket.IO setup
const httpServer = createServer(server.server);
const io = new SocketIOServer(httpServer, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		credentials: false,
		allowedHeaders: ['Content-Type', 'Authorization'],
	},
});

// Socket.IO connection handling
io.on('connection', (socket) => {
	console.log('Client connected:', socket.id);

	socket.on('disconnect', () => {
		console.log('Client disconnected:', socket.id);
	});
});

// Health check
server.get('/health', async () => {
	return { status: 'ok', timestamp: new Date().toISOString() };
});

// Initialize modules and register routes
const moduleRegistry = new ModuleRegistry(prisma, io);
await moduleRegistry.registerRoutes(server);

// Start server
const start = async () => {
	try {
		const port = parseInt(process.env.PORT || '3001');
		const host = process.env.HOST || '0.0.0.0';

		await server.listen({ port, host });
		httpServer.listen(port + 1); // Socket.IO on port+1

		console.log(`🚀 Server ready at http://${host}:${port}`);
		console.log(`🔌 Socket.IO ready at http://${host}:${port + 1}`);
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};

start();
