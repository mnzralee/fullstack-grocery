import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string()
    .min(1, 'Item name is required')
    .max(100, 'Item name must be under 100 characters')
    .trim(),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100'),
  estimatedPrice: z.number()
    .int('Price must be in cents (whole number)')
    .min(1, 'Price must be positive')
    .max(10000000, 'Price cannot exceed $100,000'),
  category: z.enum([
    'DAIRY', 'PRODUCE', 'MEAT', 'BAKERY',
    'BEVERAGES', 'SNACKS', 'HOUSEHOLD', 'OTHER',
  ]).default('OTHER'),
});

export type CreateItemDTO = z.infer<typeof createItemSchema>;

export const approveItemSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
});
export type ApproveItemDTO = z.infer<typeof approveItemSchema>;

export const markBoughtSchema = z.object({
  actualPrice: z.number()
    .int('Price must be in cents')
    .min(1, 'Price must be positive')
    .max(10000000, 'Price cannot exceed $100,000'),
});
export type MarkBoughtDTO = z.infer<typeof markBoughtSchema>;
