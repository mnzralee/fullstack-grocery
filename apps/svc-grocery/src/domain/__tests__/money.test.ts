import { describe, it, expect } from 'vitest';
import { Money } from '../value-objects/money';

describe('Money', () => {
  it('should create from cents', () => {
    const price = Money.fromCents(350);
    expect(price.inCents).toBe(350);
    expect(price.inDollars).toBe(3.5);
    expect(price.formatted).toBe('$3.50');
  });

  it('should create from dollars', () => {
    const price = Money.fromDollars(3.50);
    expect(price.inCents).toBe(350);
  });

  it('should add correctly', () => {
    const a = Money.fromCents(350);
    const b = Money.fromCents(450);
    expect(a.add(b).inCents).toBe(800);
  });

  it('should reject negative money', () => {
    const a = Money.fromCents(100);
    const b = Money.fromCents(200);
    expect(() => a.subtract(b)).toThrow('negative money');
  });

  it('should reject non-integer cents', () => {
    expect(() => Money.fromCents(3.5)).toThrow('integer');
  });
});
