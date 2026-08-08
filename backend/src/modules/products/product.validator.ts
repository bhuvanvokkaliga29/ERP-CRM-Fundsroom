import { z } from 'zod';

export const createProductSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(200),
  sku: z.string().min(1, 'SKU is required').max(50),
  description: z.string().max(1000).optional(),
  categoryId: z.string().uuid('Valid category is required'),
  warehouseId: z.string().uuid('Valid warehouse is required'),
  unitPrice: z.number().positive('Unit price must be positive'),
  costPrice: z.number().positive('Cost price must be positive').optional(),
  taxRate: z.number().min(0).max(100).default(18),
  currentStock: z.number().int().min(0).default(0),
  minimumStockAlertQuantity: z.number().int().min(0).default(10),
  imageUrl: z.string().url().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).default('ACTIVE'),
});

export const updateProductSchema = createProductSchema.partial().omit({ sku: true });

export const adjustStockSchema = z.object({
  quantity: z.number().int().refine(val => val !== 0, 'Quantity cannot be zero'),
  reason: z.enum(['INITIAL_STOCK', 'PURCHASE', 'MANUAL_ADJUSTMENT', 'CORRECTION']),
  note: z.string().max(500).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
