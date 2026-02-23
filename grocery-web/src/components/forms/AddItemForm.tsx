'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';

const addItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100).trim(),
  quantity: z.coerce.number().int().min(1, 'At least 1').max(100),
  estimatedPrice: z.coerce.number().min(0.01, 'Price must be positive').max(100000),
  category: z.enum([
    'DAIRY', 'PRODUCE', 'MEAT', 'BAKERY',
    'BEVERAGES', 'SNACKS', 'HOUSEHOLD', 'OTHER',
  ]).default('OTHER'),
});

type AddItemFormData = z.infer<typeof addItemSchema>;

interface AddItemFormProps {
  onSubmit: (data: { name: string; quantity: number; estimatedPrice: number; category: string }) => void;
  isSubmitting?: boolean;
}

export function AddItemForm({ onSubmit, isSubmitting }: AddItemFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddItemFormData>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      quantity: 1,
      category: 'OTHER',
    },
  });

  const handleFormSubmit = (data: AddItemFormData) => {
    onSubmit({
      ...data,
      estimatedPrice: Math.round(data.estimatedPrice * 100), // dollars to cents
    });
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="bg-white rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Add New Item</h3>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <input
            {...register('name')}
            placeholder="Item name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <input
            {...register('quantity')}
            type="number"
            placeholder="Qty"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.quantity && (
            <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>
          )}
        </div>

        <div>
          <input
            {...register('estimatedPrice')}
            type="number"
            step="0.01"
            placeholder="Price ($)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.estimatedPrice && (
            <p className="mt-1 text-xs text-red-600">{errors.estimatedPrice.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <select
          {...register('category')}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="DAIRY">Dairy</option>
          <option value="PRODUCE">Produce</option>
          <option value="MEAT">Meat</option>
          <option value="BAKERY">Bakery</option>
          <option value="BEVERAGES">Beverages</option>
          <option value="SNACKS">Snacks</option>
          <option value="HOUSEHOLD">Household</option>
          <option value="OTHER">Other</option>
        </select>

        <Button type="submit" loading={isSubmitting}>
          Add to List
        </Button>
      </div>
    </form>
  );
}
