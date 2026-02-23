export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    statusCode: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ItemNotFoundError extends DomainError {
  constructor(itemId: string) {
    super(
      'ITEM_NOT_FOUND',
      404,
      `Grocery item not found: ${itemId}`,
      { itemId },
    );
  }
}

export class ListNotFoundError extends DomainError {
  constructor(listId: string) {
    super(
      'LIST_NOT_FOUND',
      404,
      `Grocery list not found: ${listId}`,
      { listId },
    );
  }
}

export class InvalidItemStateError extends DomainError {
  constructor(currentStatus: string, requiredStatus: string, operation: string) {
    super(
      'INVALID_ITEM_STATE',
      400,
      `Cannot ${operation} item: status is ${currentStatus}, must be ${requiredStatus}`,
      { currentStatus, requiredStatus, operation },
    );
  }
}

export class BudgetExceededError extends DomainError {
  constructor(requested: number, available: number) {
    super(
      'BUDGET_EXCEEDED',
      400,
      `Budget exceeded: requested ${requested} cents, only ${available} cents available`,
      { requestedCents: requested, availableCents: available },
    );
  }
}

export class InsufficientPermissionsError extends DomainError {
  constructor(requiredRole: string, operation: string) {
    super(
      'INSUFFICIENT_PERMISSIONS',
      403,
      `Insufficient permissions: ${operation} requires ${requiredRole} role`,
      { requiredRole, operation },
    );
  }
}
