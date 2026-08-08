import { z } from 'zod';

export const createCustomerSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(200),
  mobileNumber: z.string().min(10, 'Valid mobile number is required').max(15),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  businessName: z.string().max(200).optional().or(z.literal('')),
  gstNumber: z.string().max(20).optional().or(z.literal('')),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).default('RETAIL'),
  address: z.string().max(500).optional().or(z.literal('')),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  followUpDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
