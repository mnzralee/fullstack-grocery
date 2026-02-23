'use client';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  BOUGHT: 'bg-blue-100 text-blue-800',
  ARCHIVED: 'bg-gray-100 text-gray-800',
};

export function Badge({ status }: { status: string }) {
  const colorClass = statusColors[status] ?? 'bg-gray-100 text-gray-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
}
