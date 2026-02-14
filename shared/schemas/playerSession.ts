import { z } from "zod";
import { SessionStatus } from "../types/sessionStatus";

// Session Status enum
export const SessionStatusSchema = z.nativeEnum(SessionStatus);

// Base PlayerSession schema
export const PlayerSessionSchema = z.object({
  id: z.string(),
  barcodeId: z.string(),
  totalAllowedSeconds: z.number().int().nonnegative(),
  accumulatedSeconds: z.number().int().nonnegative(),
  lastStartAt: z.date().nullable(),
  isActive: z.boolean(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// PlayerSession with computed fields
export const PlayerSessionStatusSchema = PlayerSessionSchema.extend({
  remainingSeconds: z.number().int().nonnegative(),
  remainingMinutes: z.number().int().nonnegative(),
  status: SessionStatusSchema,
});

// PlayerSession with additional computed fields for UI
export const SessionWithComputedFieldsSchema = PlayerSessionStatusSchema.extend({
  isExpired: z.boolean(),
  timeProgress: z.number().min(0).max(100), // percentage 0-100
});

// Request schemas
export const SessionPlayRequestSchema = z.object({
  barcodeId: z.string().min(1, "Barcode ID is required"),
});

export const SessionPauseRequestSchema = z.object({
  barcodeId: z.string().min(1, "Barcode ID is required"),
});

export const SessionStatusRequestSchema = z.object({
  barcodeId: z.string().min(1, "Barcode ID is required"),
});

// Response schemas
export const SessionStatusResponseSchema = PlayerSessionStatusSchema;

export const ActiveSessionsResponseSchema = z.array(PlayerSessionStatusSchema);

// Type exports
export type PlayerSessionSchema = z.infer<typeof PlayerSessionSchema>;
export type PlayerSessionStatusSchema = z.infer<typeof PlayerSessionStatusSchema>;
export type SessionWithComputedFieldsSchema = z.infer<typeof SessionWithComputedFieldsSchema>;
export type SessionPlayRequestSchema = z.infer<typeof SessionPlayRequestSchema>;
export type SessionPauseRequestSchema = z.infer<typeof SessionPauseRequestSchema>;
export type SessionStatusRequestSchema = z.infer<typeof SessionStatusRequestSchema>;
export type SessionStatusResponseSchema = z.infer<typeof SessionStatusResponseSchema>;
export type ActiveSessionsResponseSchema = z.infer<typeof ActiveSessionsResponseSchema>;
