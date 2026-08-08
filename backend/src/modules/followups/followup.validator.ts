import { z } from 'zod';

export const createFollowUpSchema = z.object({
  customerId: z.string().uuid(),
  assignedToId: z.string().uuid().optional().nullable(),
  scheduledAt: z.string().datetime(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'OTHER']).default('CALL'),
  note: z.string().max(2000).optional(),
});

export const updateFollowUpSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'OTHER']).optional(),
  note: z.string().max(2000).optional(),
  outcome: z.string().max(2000).optional(),
});

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
