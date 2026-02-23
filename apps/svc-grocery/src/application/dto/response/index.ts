export interface GroceryItemResponseDTO {
  id: string;
  name: string;
  quantity: number;
  estimatedPrice: number;
  actualPrice: number | null;
  category: string;
  status: string;
  addedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface BudgetSummaryDTO {
  monthlyBudget: number;
  totalSpent: number;
  totalApproved: number;
  remaining: number;
  itemCounts: {
    pending: number;
    approved: number;
    bought: number;
    rejected: number;
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
    details?: Record<string, unknown>;
  };
}
