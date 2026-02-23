import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryClient';
import type { GroceryListResponse } from '@/types/grocery';

export function useGroceryList(listId: string) {
  return useQuery({
    queryKey: queryKeys.grocery.list(listId),
    queryFn: async (): Promise<GroceryListResponse> => {
      const response = await apiClient<{ success: boolean; data: GroceryListResponse }>(
        `/grocery/items?listId=${listId}`,
      );
      return response.data;
    },
    enabled: !!listId,
  });
}

export function useCreateItem(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      quantity: number;
      estimatedPrice: number;
      category: string;
    }) => {
      return apiClient('/grocery/items', {
        method: 'POST',
        body: JSON.stringify({ listId, ...data }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grocery.list(listId) });
    },
  });
}

export function useApproveItem(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, action }: { itemId: string; action: 'APPROVE' | 'REJECT' }) => {
      return apiClient(`/grocery/items/${itemId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grocery.list(listId) });
    },
  });
}

export function useMarkBought(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, actualPrice }: { itemId: string; actualPrice: number }) => {
      return apiClient(`/grocery/items/${itemId}/buy`, {
        method: 'POST',
        body: JSON.stringify({ actualPrice }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grocery.list(listId) });
    },
  });
}
