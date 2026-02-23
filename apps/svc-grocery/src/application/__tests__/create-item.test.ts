import { describe, it, expect, vi } from 'vitest';
import { CreateGroceryItemUseCase } from '../use-cases/grocery';
import { ListNotFoundError } from '../../domain/errors';

const mockItemRepo = {
  findById: vi.fn(),
  findByListId: vi.fn(),
  findByListIdAndStatus: vi.fn(),
  create: vi.fn(),
  updateStatus: vi.fn(),
};

const mockListRepo = {
  findById: vi.fn(),
  findByUserId: vi.fn(),
  calculateSpent: vi.fn(),
};

describe('CreateGroceryItemUseCase', () => {
  const useCase = new CreateGroceryItemUseCase(mockItemRepo, mockListRepo);

  it('should create an item when list exists', async () => {
    mockListRepo.findById.mockResolvedValue({
      id: 'list-1',
      name: 'Test List',
      monthlyBudget: 50000,
    });

    mockItemRepo.create.mockResolvedValue({
      id: 'item-1',
      name: 'Milk',
      quantity: 2,
      estimatedPrice: 350,
      actualPrice: null,
      category: 'DAIRY',
      status: 'PENDING',
      addedById: 'user-1',
      addedByName: 'Alex',
      listId: 'list-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute('user-1', 'list-1', {
      name: 'Milk',
      quantity: 2,
      estimatedPrice: 350,
      category: 'DAIRY',
    });

    expect(result.name).toBe('Milk');
    expect(result.status).toBe('PENDING');
    expect(mockItemRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Milk', listId: 'list-1' }),
    );
  });

  it('should throw ListNotFoundError when list does not exist', async () => {
    mockListRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', 'nonexistent', {
        name: 'Milk',
        quantity: 1,
        estimatedPrice: 350,
        category: 'DAIRY',
      }),
    ).rejects.toThrow(ListNotFoundError);
  });
});
