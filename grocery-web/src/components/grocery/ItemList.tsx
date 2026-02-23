'use client';

import type { GroceryItem } from '@/types/grocery';
import { GroceryItemCard } from './GroceryItemCard';

interface ItemListProps {
  items: GroceryItem[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onMarkBought?: (id: string) => void;
}

const STATUS_ORDER = ['PENDING', 'APPROVED', 'BOUGHT', 'REJECTED', 'ARCHIVED'];
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending Approval',
  APPROVED: 'Ready to Buy',
  BOUGHT: 'Purchased',
  REJECTED: 'Rejected',
  ARCHIVED: 'Archived',
};

export function ItemList({ items, onApprove, onReject, onMarkBought }: ItemListProps) {
  const groupedItems = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    items: items.filter((item) => item.status === status),
  })).filter((group) => group.items.length > 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No items yet. Add your first grocery item below.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedItems.map((group) => (
        <div key={group.status}>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
            {group.label} ({group.items.length})
          </h3>
          <div className="space-y-2">
            {group.items.map((item) => (
              <GroceryItemCard
                key={item.id}
                item={item}
                onApprove={onApprove}
                onReject={onReject}
                onMarkBought={onMarkBought}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
