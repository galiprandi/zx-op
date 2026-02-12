import { z } from "zod";

// Base Product schema
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  category: z.string(),
  required: z.boolean(),
  timeValueSeconds: z.number().int().nonnegative().nullable().optional(),
  isDeleted: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Request schemas
export const CreateProductRequestSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  category: z.string().min(1, "Category is required"),
  required: z.boolean().optional().default(false),
  timeValueSeconds: z.number().int().nonnegative().optional(),
});

export const UpdateProductRequestSchema = z.object({
  name: z.string().min(1, "Product name must be non-empty").optional(),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
  category: z.string().min(1, "Category must be non-empty").optional(),
  required: z.boolean().optional(),
  timeValueSeconds: z.number().int().nonnegative().optional(),
});

// Response schemas
export const ProductListResponseSchema = z.array(ProductSchema);

export const ProductCategorySchema = z.object({
  name: z.string(),
  count: z.number().int().nonnegative(),
});

export const ProductCategoryListSchema = z.array(ProductCategorySchema);

// Validation schemas for specific use cases
export const TimeProductSchema = ProductSchema.extend({
  timeValueSeconds: z.number().int().positive(),
});

export const RequiredProductSchema = ProductSchema.extend({
  required: z.literal(true),
});

// Type exports
export type ProductSchema = z.infer<typeof ProductSchema>;
export type CreateProductRequestSchema = z.infer<typeof CreateProductRequestSchema>;
export type UpdateProductRequestSchema = z.infer<typeof UpdateProductRequestSchema>;
export type ProductListResponseSchema = z.infer<typeof ProductListResponseSchema>;
export type ProductCategorySchema = z.infer<typeof ProductCategorySchema>;
export type ProductCategoryListSchema = z.infer<typeof ProductCategoryListSchema>;
export type TimeProductSchema = z.infer<typeof TimeProductSchema>;
export type RequiredProductSchema = z.infer<typeof RequiredProductSchema>;
