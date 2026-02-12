import { z } from "zod";

// Base Transaction schema
export const TransactionSchema = z.object({
  id: z.string(),
  playerSessionId: z.string(),
  productId: z.string(),
  quantity: z.number().int().min(1),
  totalPrice: z.number().nonnegative(),
  createdAt: z.date(),
});

// Transaction with relations
export const TransactionWithRelationsSchema = TransactionSchema.extend({
  playerSession: z.object({
    id: z.string(),
    barcodeId: z.string(),
  }),
  product: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().nonnegative(),
    category: z.string(),
    timeValueSeconds: z.number().int().nonnegative().nullable(),
  }),
});

// Request schemas
export const CreateTransactionRequestSchema = z.object({
  playerSessionId: z.string().min(1, "Player session ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  totalPrice: z.number().positive("Total price must be positive"),
});

// Response schemas
export const TransactionListResponseSchema = z.array(TransactionWithRelationsSchema);

// Stats schema
export const TransactionStatsSchema = z.object({
  totalTransactions: z.number().int().nonnegative(),
  totalRevenue: z.number().nonnegative(),
  topProducts: z.array(z.object({
    productId: z.string(),
    product: z.object({
      name: z.string(),
      category: z.string(),
    }),
    _sum: z.object({
      totalPrice: z.number().nonnegative(),
    }),
    _count: z.object({
      id: z.number().int().nonnegative(),
    }),
  })),
});

// Query parameter schemas
export const TransactionQuerySchema = z.object({
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  playerSessionId: z.string().optional(),
  barcodeId: z.string().optional(),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

// Type exports
export type TransactionSchema = z.infer<typeof TransactionSchema>;
export type TransactionWithRelationsSchema = z.infer<typeof TransactionWithRelationsSchema>;
export type CreateTransactionRequestSchema = z.infer<typeof CreateTransactionRequestSchema>;
export type TransactionListResponseSchema = z.infer<typeof TransactionListResponseSchema>;
export type TransactionStatsSchema = z.infer<typeof TransactionStatsSchema>;
export type TransactionQuerySchema = z.infer<typeof TransactionQuerySchema>;
