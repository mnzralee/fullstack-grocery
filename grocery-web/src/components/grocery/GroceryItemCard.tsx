'use client';

import type { GroceryItem } from '@/types/grocery';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface GroceryItemCardProps {
  item: GroceryItem;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onMarkBought?: (id: string) => void;
}

export function GroceryItemCard({
  item,
  onApprove,
  onReject,
  onMarkBought,
}: GroceryItemCardProps) {
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{item.name}</span>
          <Badge status={item.status} />
        </div>
        <div className="text-sm text-gray-500 mt-1">
          x{item.quantity} · Est: {formatPrice(item.estimatedPrice)}
          {item.actualPrice !== null && (
            <span className="ml-2 text-green-600">
              Paid: {formatPrice(item.actualPrice)}
            </span>
          )}
          <span className="ml-2">· Added by {item.addedBy.name}</span>
        </div>
      </div>

      <div className="flex gap-2 ml-4">
        {item.status === 'PENDING' && onApprove && (
          <>
            <Button variant="success" onClick={() => onApprove(item.id)}>
              Approve
            </Button>
            <Button variant="danger" onClick={() => onReject?.(item.id)}>
              Reject
            </Button>
          </>
        )}
        {item.status === 'APPROVED' && onMarkBought && (
          <Button variant="primary" onClick={() => onMarkBought(item.id)}>
            Mark Bought
          </Button>
        )}
      </div>
    </div>
  );
}
