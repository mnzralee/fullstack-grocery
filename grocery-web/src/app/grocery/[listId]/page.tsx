'use client';

import { useParams } from 'next/navigation';
import { useGroceryList, useCreateItem, useApproveItem, useMarkBought } from '@/lib/hooks/useGrocery';
import { BudgetBar } from '@/components/grocery/BudgetBar';
import { ItemList } from '@/components/grocery/ItemList';
import { AddItemForm } from '@/components/forms/AddItemForm';

export default function GroceryListPage() {
  const params = useParams();
  const listId = params.listId as string;

  const { data, isLoading, isError, error } = useGroceryList(listId);
  const createItem = useCreateItem(listId);
  const approveItem = useApproveItem(listId);
  const markBought = useMarkBought(listId);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-16 bg-gray-200 rounded" />
          <div className="h-16 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load grocery list: {error?.message ?? 'Unknown error'}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const handleApprove = (itemId: string) => {
    approveItem.mutate({ itemId, action: 'APPROVE' });
  };

  const handleReject = (itemId: string) => {
    approveItem.mutate({ itemId, action: 'REJECT' });
  };

  const handleMarkBought = (itemId: string) => {
    const item = data.items.find((i) => i.id === itemId);
    if (item) {
      markBought.mutate({ itemId, actualPrice: item.estimatedPrice });
    }
  };

  const handleAddItem = (itemData: {
    name: string;
    quantity: number;
    estimatedPrice: number;
    category: string;
  }) => {
    createItem.mutate(itemData);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Grocery List
      </h1>

      <BudgetBar budget={data.budget} />

      <ItemList
        items={data.items}
        onApprove={handleApprove}
        onReject={handleReject}
        onMarkBought={handleMarkBought}
      />

      <AddItemForm
        onSubmit={handleAddItem}
        isSubmitting={createItem.isPending}
      />
    </div>
  );
}
