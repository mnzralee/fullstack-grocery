import { describe, it, expect } from 'vitest';
import { ItemNotFoundError, InvalidItemStateError, BudgetExceededError } from '../errors';

describe('Domain Errors', () => {
  it('should create ItemNotFoundError with correct fields', () => {
    const error = new ItemNotFoundError('item-123');

    expect(error.code).toBe('ITEM_NOT_FOUND');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Grocery item not found: item-123');
    expect(error.details).toEqual({ itemId: 'item-123' });
    expect(error.timestamp).toBeDefined();
    expect(error).toBeInstanceOf(Error);
  });

  it('should create InvalidItemStateError with transition context', () => {
    const error = new InvalidItemStateError('BOUGHT', 'PENDING', 'approve');

    expect(error.code).toBe('INVALID_ITEM_STATE');
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({
      currentStatus: 'BOUGHT',
      requiredStatus: 'PENDING',
      operation: 'approve',
    });
  });

  it('should create BudgetExceededError with amounts', () => {
    const error = new BudgetExceededError(1500, 800);

    expect(error.code).toBe('BUDGET_EXCEEDED');
    expect(error.details).toEqual({
      requestedCents: 1500,
      availableCents: 800,
    });
  });
});
