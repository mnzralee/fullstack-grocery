'use client';

import type { BudgetSummary } from '@/types/grocery';

export function BudgetBar({ budget }: { budget: BudgetSummary }) {
  const spentPercent = budget.monthlyBudget > 0
    ? Math.min((budget.totalSpent / budget.monthlyBudget) * 100, 100)
    : 0;

  const approvedPercent = budget.monthlyBudget > 0
    ? Math.min(((budget.totalSpent + budget.totalApproved) / budget.monthlyBudget) * 100, 100)
    : 0;

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">Monthly Budget</h3>
        <span className="text-sm text-gray-500">
          {formatPrice(budget.totalSpent)} / {formatPrice(budget.monthlyBudget)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
        {/* Approved (lighter) */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-200 rounded-full transition-all duration-500"
          style={{ width: `${approvedPercent}%` }}
        />
        {/* Spent (solid) */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${spentPercent}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Remaining: {formatPrice(budget.remaining)}</span>
        <span>
          {budget.itemCounts.pending} pending · {budget.itemCounts.approved} approved · {budget.itemCounts.bought} bought
        </span>
      </div>
    </div>
  );
}
