import type { EventType, Prisma, PrismaClient } from "@prisma/client";
import type { Server as SocketIOServer } from "socket.io";

export class EventService {
	constructor(
		private prisma: PrismaClient,
		private io: SocketIOServer,
	) {}

	async getAllEvents() {
		return await this.prisma.event.findMany({
			include: {
				session: {
					include: {
						wristband: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}

	async createEvent(
		sessionId: string,
		type: EventType,
		data?: Prisma.InputJsonValue,
	) {
		const event = await this.prisma.event.create({
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

		this.io.emit("event:created", event);
		return event;
	}

	async deleteEvent(id: string) {
		const event = await this.prisma.event.delete({
			where: { id },
			include: {
				session: {
					include: {
						wristband: true,
					},
				},
			},
		});

		this.io.emit("event:deleted", event);
		return event;
	}
}
