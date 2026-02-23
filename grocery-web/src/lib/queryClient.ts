export const queryKeys = {
  grocery: {
    all: ['grocery'] as const,
    list: (listId: string) => [...queryKeys.grocery.all, 'list', listId] as const,
    budget: (listId: string) => [...queryKeys.grocery.all, 'budget', listId] as const,
  },
};
