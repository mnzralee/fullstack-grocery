export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  estimatedPrice: number;
  actualPrice: number | null;
  category: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BOUGHT' | 'ARCHIVED';
  addedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface BudgetSummary {
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

export interface GroceryListResponse {
  items: GroceryItem[];
  budget: BudgetSummary;
}
