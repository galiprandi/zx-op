import { z } from "zod";

// Base SessionLog schema
export const SessionLogSchema = z.object({
  id: z.string(),
  playerSessionId: z.string(),
  action: z.enum(['CHECKIN', 'PLAY', 'PAUSE', 'TIME_ADDED', 'AUTO_EXPIRE']),
  data: z.any().optional(),
  createdAt: z.date(),
});

// SessionLog with session relation
export const SessionLogWithSessionSchema = SessionLogSchema.extend({
  playerSession: z.object({
    id: z.string(),
    barcodeId: z.string(),
  }),
});

// Specific data schemas for different actions
export const CheckinLogDataSchema = z.object({
  created: z.boolean().optional(),
  products: z.array(z.object({
    id: z.string(),
    quantity: z.number().int().positive(),
  })).optional(),
});

export const PlayLogDataSchema = z.object({}).optional();

export const PauseLogDataSchema = z.object({
  extra: z.number().int().nonnegative(),
}).optional();

export const TimeAddedLogDataSchema = z.object({
  totalSecondsToAdd: z.number().int().positive(),
}).optional();

export const AutoExpireLogDataSchema = z.object({}).optional();

// Response schemas
export const SessionLogListResponseSchema = z.array(SessionLogWithSessionSchema);

// Query parameter schemas
export const SessionLogQuerySchema = z.object({
  playerSessionId: z.string().optional(),
  barcodeId: z.string().optional(),
  action: z.enum(['CHECKIN', 'PLAY', 'PAUSE', 'TIME_ADDED', 'AUTO_EXPIRE']).optional(),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

// Type exports
export type SessionLogSchema = z.infer<typeof SessionLogSchema>;
export type SessionLogWithSessionSchema = z.infer<typeof SessionLogWithSessionSchema>;
export type CheckinLogDataSchema = z.infer<typeof CheckinLogDataSchema>;
export type PlayLogDataSchema = z.infer<typeof PlayLogDataSchema>;
export type PauseLogDataSchema = z.infer<typeof PauseLogDataSchema>;
export type TimeAddedLogDataSchema = z.infer<typeof TimeAddedLogDataSchema>;
export type AutoExpireLogDataSchema = z.infer<typeof AutoExpireLogDataSchema>;
export type SessionLogListResponseSchema = z.infer<typeof SessionLogListResponseSchema>;
export type SessionLogQuerySchema = z.infer<typeof SessionLogQuerySchema>;
