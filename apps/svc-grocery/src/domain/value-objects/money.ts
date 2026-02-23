export class Money {
  private constructor(private readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents)) {
      throw new Error(`Money must be an integer (cents), got: ${cents}`);
    }
    if (cents < 0) {
      throw new Error(`Money cannot be negative, got: ${cents}`);
    }
    return new Money(cents);
  }

  static fromDollars(dollars: number): Money {
    return Money.fromCents(Math.round(dollars * 100));
  }

  get inCents(): number {
    return this.cents;
  }

  get inDollars(): number {
    return this.cents / 100;
  }

  get formatted(): string {
    return `$${this.inDollars.toFixed(2)}`;
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    const result = this.cents - other.cents;
    if (result < 0) {
      throw new Error(`Cannot subtract: would result in negative money (${result} cents)`);
    }
    return Money.fromCents(result);
  }

  isGreaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}
