import { InvalidItemStateError } from '../errors';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:  ['APPROVED', 'REJECTED'],
  APPROVED: ['BOUGHT'],
  REJECTED: [],        // Terminal state
  BOUGHT:   ['ARCHIVED'],
  ARCHIVED: [],        // Terminal state
};

export function canTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function assertTransition(from: string, to: string, operation: string): void {
  if (!canTransition(from, to)) {
    throw new InvalidItemStateError(from, to, operation);
  }
}
