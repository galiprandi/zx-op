import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { PrismaClient } from "@prisma/client";
import fastify from "fastify";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

const server = fastify({
	logger: true,
});

// Register CORS plugin
await server.register(cors, {
	origin: [
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"http://localhost:59996",
		"http://127.0.0.1:59996",
	],
	credentials: true,
});

await server.register(websocket);

// Prisma client
const prisma = new PrismaClient();

// Socket.IO setup
const httpServer = createServer(server.server);
const io = new SocketIOServer(httpServer, {
	cors: {
		origin: [
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:59996",
			"http://127.0.0.1:59996",
		],
		credentials: true,
	},
});

// Socket.IO connection handling
io.on("connection", (socket) => {
	console.log("Client connected:", socket.id);

	socket.on("disconnect", () => {
		console.log("Client disconnected:", socket.id);
	});
});

// Health check
server.get("/health", async () => {
	return { status: "ok", timestamp: new Date().toISOString() };
});

// Basic API routes
server.get("/api/wristbands", async () => {
	const wristbands = await prisma.wristband.findMany({
		include: {
			user: true,
			sessions: {
				where: { status: { in: ["ACTIVE", "PAUSED"] } },
				orderBy: { createdAt: "desc" },
				take: 1,
			},
		},
	});
	return wristbands;
});

server.post("/api/wristbands", async (request, reply) => {
	try {
		const { qrCode, userId } = request.body as any;

		// Build data object only with provided fields
		const data: any = { qrCode };
		if (userId !== undefined && userId !== null) {
			data.userId = userId;
		}

		const wristband = await prisma.wristband.create({
			data,
			include: {
				user: true,
				sessions: true,
			},
		});

		io.emit("wristband:created", wristband);
		return wristband;
	} catch (error) {
		console.error("Error creating wristband:", error);
		reply.status(400).send({
			error: "Error creating wristband",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

server.put("/api/wristbands/:id", async (request, reply) => {
	try {
		const { id } = request.params as { id: string };
		const { userId } = request.body as any;

		const wristband = await prisma.wristband.update({
			where: { id },
			data: { userId },
			include: {
				user: true,
				sessions: true,
			},
		});

		io.emit("wristband:updated", wristband);
		return wristband;
	} catch (error) {
		reply.status(400).send({ error: "Error updating wristband" });
	}
});

server.delete("/api/wristbands/:id", async (request, reply) => {
	try {
		const { id } = request.params as { id: string };
		const wristband = await prisma.wristband.delete({
			where: { id },
			include: {
				user: true,
				sessions: true,
			},
		});

		io.emit("wristband:deleted", wristband);
		return wristband;
	} catch (error) {
		reply.status(400).send({ error: "Error deleting wristband" });
	}
});

// Sessions API routes
server.get("/api/sessions", async () => {
	const sessions = await prisma.session.findMany({
		include: {
			wristband: true,
			events: true,
		},
		orderBy: { createdAt: "desc" },
	});
	return sessions;
});

server.post("/api/sessions", async (request, reply) => {
	try {
		const { wristbandId, purchasedMinutes } = request.body as any;
		const session = await prisma.session.create({
			data: {
				wristbandId,
				purchasedMinutes,
				status: "IDLE",
			},
			include: {
				wristband: true,
				events: true,
			},
		});

		io.emit("session:created", session);
		return session;
	} catch (error) {
		reply.status(400).send({ error: "Error creating session" });
	}
});

server.put("/api/sessions/:id/start", async (request, reply) => {
	try {
		const { id } = request.params as { id: string };

		const session = await prisma.session.update({
			where: { id },
			data: {
				status: "ACTIVE",
				startTime: new Date(),
			},
			include: {
				wristband: true,
				events: true,
			},
		});

		io.emit("session:started", session);
		return session;
	} catch (error) {
		reply.status(400).send({ error: "Error starting session" });
	}
});

server.put("/api/sessions/:id/pause", async (request, reply) => {
	try {
		const { id } = request.params as { id: string };

		const session = await prisma.session.update({
			where: { id },
			data: {
				status: "PAUSED",
				lastPauseTime: new Date(),
			},
			include: {
				wristband: true,
				events: true,
			},
		});

		io.emit("session:paused", session);
		return session;
	} catch (error) {
		reply.status(400).send({ error: "Error pausing session" });
	}
});

server.put("/api/sessions/:id/end", async (request, reply) => {
	try {
		const { id } = request.params as { id: string };

		const session = await prisma.session.update({
			where: { id },
			data: {
				status: "ENDED",
				endTime: new Date(),
			},
			include: {
				wristband: true,
				events: true,
			},
		});

		io.emit("session:ended", session);
		return session;
	} catch (error) {
		reply.status(400).send({ error: "Error ending session" });
	}
});

server.delete("/api/sessions/:id", async (request, reply) => {
	try {
		const { id } = request.params as { id: string };
		const session = await prisma.session.delete({
			where: { id },
			include: {
				wristband: true,
				events: true,
			},
		});

		io.emit("session:deleted", session);
		return session;
	} catch (error) {
		reply.status(400).send({ error: "Error deleting session" });
	}
});

// Transactions API routes
server.get("/api/transactions", async () => {
	const transactions = await prisma.transaction.findMany({
		include: {
			wristband: true,
			product: true,
		},
		orderBy: { createdAt: "desc" },
	});
	return transactions;
});

server.post("/api/transactions", async (request, reply) => {
	try {
		const { wristbandId, productId, quantity, totalPrice } =
			request.body as any;

		const transaction = await prisma.transaction.create({
			data: {
				wristbandId,
				productId,
				quantity,
				totalPrice,
			},
			include: {
				wristband: true,
				product: true,
			},
		});

		io.emit("transaction:created", transaction);
		return transaction;
	} catch (error) {
		reply.status(400).send({ error: "Error creating transaction" });
	}
});

server.delete("/api/transactions/:id", async (request, reply) => {
	try {
		const { id } = request.params as { id: string };
		const transaction = await prisma.transaction.delete({
			where: { id },
			include: {
				wristband: true,
				product: true,
			},
		});

		io.emit("transaction:deleted", transaction);
		return transaction;
	} catch (error) {
		reply.status(400).send({ error: "Error deleting transaction" });
	}
});

// Events API routes
server.get("/api/events", async () => {
	const events = await prisma.event.findMany({
		include: {
			session: {
				include: {
					wristband: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});
	return events;
});

server.post("/api/events", async (request, reply) => {
	try {
		const { sessionId, type, data } = request.body as any;

		const event = await prisma.event.create({
			data: {
				sessionId,
				type,
				data,
			},
			include: {
				session: {
					include: {
						wristband: true,
					},
				},
			},
		});

		io.emit("event:created", event);
		return event;
	} catch (error) {
		reply.status(400).send({ error: "Error creating event" });
	}
});

server.delete("/api/events/:id", async (request, reply) => {
	try {
		const { id } = request.params as { id: string };
		const event = await prisma.event.delete({
			where: { id },
			include: {
				session: {
					include: {
						wristband: true,
					},
				},
			},
		});

		io.emit("event:deleted", event);
		return event;
	} catch (error) {
		reply.status(400).send({ error: "Error deleting event" });
	}
});

// Products API routes
server.get("/api/products", async () => {
	const products = await prisma.product.findMany({
		where: { isDeleted: false },
		orderBy: { createdAt: "desc" },
	});
	return products;
});

server.post("/api/products", async (request, reply) => {
	try {
		const { name, description, price, category, required } =
			request.body as any;
		const product = await prisma.product.create({
			data: {
				name,
				description,
				price: Number(price),
				category,
				required: Boolean(required),
			},
		});
		io.emit("product:created", product);
		return product;
	} catch (error) {
		reply.status(400).send({ error: "Error creating product" });
	}
});

server.put("/api/products/:id", async (request, reply) => {
	try {
		const { id } = request.params as { id: string };
		const { name, description, price, category, required } =
			request.body as any;

		const product = await prisma.product.update({
			where: { id },
			data: {
				name,
				description,
				price: Number(price),
				category,
				required: Boolean(required),
			},
		});

		// Emit socket event for product update
		io.emit("product:updated", product);

		return product;
	} catch (error) {
		reply.status(400).send({ error: "Error updating product" });
	}
});

server.delete("/api/products/:id", async (request, reply) => {
	try {
		const { id } = request.params as { id: string };
		const product = await prisma.product.update({
			where: { id },
			data: { isDeleted: true },
		});

		// Emit socket event for product deletion
		io.emit("product:deleted", product);

		return product;
	} catch (error) {
		reply.status(400).send({ error: "Error deleting product" });
	}
});

// Start server
const start = async () => {
	try {
		const port = parseInt(process.env.PORT || "3001");
		const host = process.env.HOST || "0.0.0.0";

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
