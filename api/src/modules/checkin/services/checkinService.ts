import type { Prisma, PrismaClient } from "@prisma/client";
import type { Server as SocketIOServer } from "socket.io";

export class CheckinService {
	constructor(
		private prisma: PrismaClient,
		private io: SocketIOServer,
	) {}

	async processCheckin(
		wristbandCode: string,
		products: { id: string; quantity: number }[],
		transactionNumber?: string,
	) {
		if (!wristbandCode || !products || products.length === 0) {
			throw new Error("wristbandCode and products are required");
		}

		// Find or create wristband
		let wristband = await this.prisma.wristband.findUnique({
			where: { qrCode: wristbandCode },
		});

		if (!wristband) {
			wristband = await this.prisma.wristband.create({
				data: { qrCode: wristbandCode },
			});
			this.io.emit("wristband:created", wristband);
		}

		// Create transactions for each product
		const transactions = [];
		let totalPrice = 0;

		for (const product of products) {
			const productData = await this.prisma.product.findUnique({
				where: { id: product.id },
			});

			if (!productData || productData.isDeleted) {
				throw new Error(`Product with id ${product.id} not found or deleted`);
			}

			const itemTotalPrice = productData.price * product.quantity;
			totalPrice += itemTotalPrice;

			const transaction = await this.prisma.transaction.create({
				data: {
					wristbandId: wristband.id,
					productId: product.id,
					quantity: product.quantity,
					totalPrice: itemTotalPrice,
				},
				include: {
					wristband: true,
					product: true,
				},
			});

			transactions.push(transaction);
			this.io.emit("transaction:created", transaction);
		}

		// Check if there's an active session for this wristband
		const activeSession = await this.prisma.session.findFirst({
			where: {
				wristbandId: wristband.id,
				status: { in: ["IDLE", "ACTIVE", "PAUSED"] },
			},
			orderBy: { createdAt: "desc" },
		});

		let session = activeSession;

		// If no active session, create a new one
		if (!session) {
			// Calculate total minutes from products (assuming each product gives certain minutes)
			// This logic might need adjustment based on business rules
			const totalMinutes = products.reduce((acc, product) => {
				// For now, let's assume each product gives 10 minutes per unit
				// This should be configurable based on product type
				return acc + product.quantity * 10;
			}, 0);

			session = await this.prisma.session.create({
				data: {
					wristbandId: wristband.id,
					purchasedMinutes: totalMinutes,
					status: "IDLE",
				},
				include: {
					wristband: true,
					events: true,
				},
			});

			this.io.emit("session:created", session);
		}

		// Create event for checkin
		await this.prisma.event.create({
			data: {
				sessionId: session.id,
				type: "TRANSACTION_CREATED",
				data: {
					transactionNumber,
					products,
					totalPrice,
				} as Prisma.InputJsonValue,
			},
		});

		return {
			wristband,
			session,
			transactions,
			totalPrice,
		};
	}
}
