import { z } from "zod";
import { EventType, SessionStatus } from "../types";

// Base schemas
export const WristbandSchema = z.object({
	id: z.string(),
	qrCode: z.string().min(1),
	userId: z.string().optional(),
});

export const UserSchema = z.object({
	id: z.string(),
	name: z.string().optional(),
	email: z.string().email().optional(),
});

export const SessionSchema = z.object({
	id: z.string(),
	wristbandId: z.string(),
	status: z.nativeEnum(SessionStatus),
	purchasedMinutes: z.number().min(0),
	startTime: z.date().optional(),
	endTime: z.date().optional(),
	lastPauseTime: z.date().optional(),
});

export const ProductSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	description: z.string().optional(),
	price: z.number().min(0),
	category: z.string().min(1),
});

export const TransactionSchema = z.object({
	id: z.string(),
	wristbandId: z.string(),
	productId: z.string(),
	quantity: z.number().min(1),
	totalPrice: z.number().min(0),
});

export const EventSchema = z.object({
	id: z.string(),
	sessionId: z.string(),
	type: z.nativeEnum(EventType),
	data: z.any().optional(),
});

// API Request/Response schemas
export const CreateWristbandRequest = WristbandSchema.pick({
	qrCode: true,
	userId: true,
}).extend({
	userId: z.string().optional(),
});

export const CreateSessionRequest = SessionSchema.pick({
	wristbandId: true,
	purchasedMinutes: true,
});

export const UpdateSessionStatusRequest = SessionSchema.pick({
	status: true,
});

export const CreateTransactionRequest = TransactionSchema.pick({
	wristbandId: true,
	productId: true,
	quantity: true,
});

export const ScanWristbandRequest = z.object({
	qrCode: z.string().min(1),
});

// Query schemas
export const GetWristbandByQrCodeQuery = z.object({
	qrCode: z.string().min(1),
});

export const GetSessionsByStatusQuery = z.object({
	status: z.nativeEnum(SessionStatus).optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});

export const GetEventsByDateRangeQuery = z.object({
	startDate: z.string().datetime(),
	endDate: z.string().datetime(),
	eventType: z.nativeEnum(EventType).optional(),
});

// Response schemas
export const ApiResponseSchema = z.object({
	success: z.boolean(),
	data: z.any().optional(),
	error: z.string().optional(),
	timestamp: z.string(),
});

// Socket event schemas
export const CacheInvalidateEventSchema = z.object({
	queryKey: z.array(z.string()),
	data: z.any(),
});

export type CreateWristbandRequest = z.infer<typeof CreateWristbandRequest>;
export type CreateSessionRequest = z.infer<typeof CreateSessionRequest>;
export type UpdateSessionStatusRequest = z.infer<
	typeof UpdateSessionStatusRequest
>;
export type CreateTransactionRequest = z.infer<typeof CreateTransactionRequest>;
export type ScanWristbandRequest = z.infer<typeof ScanWristbandRequest>;
export type GetWristbandByQrCodeQuery = z.infer<
	typeof GetWristbandByQrCodeQuery
>;
export type GetSessionsByStatusQuery = z.infer<typeof GetSessionsByStatusQuery>;
export type GetEventsByDateRangeQuery = z.infer<
	typeof GetEventsByDateRangeQuery
>;
export type CacheInvalidateEvent = z.infer<typeof CacheInvalidateEventSchema>;
export type UpdateProductRequest = z.infer<typeof UpdateProductRequest>;
