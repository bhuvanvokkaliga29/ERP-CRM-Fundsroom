import { z } from 'zod';

export const challanItemSchema = z.object({
  productId: z.string().uuid('Valid product is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid('Valid customer is required'),
  items: z.array(challanItemSchema).min(1, 'At least one item is required'),
  notes: z.string().max(1000).optional(),
});

export const updateChallanSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(challanItemSchema).min(1).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
