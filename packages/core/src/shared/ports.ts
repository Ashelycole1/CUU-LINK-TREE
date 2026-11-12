/**
 * Ports: small interfaces the domain depends on instead of concrete
 * platform APIs. Swapping them makes services deterministic in tests.
 */
export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** A fixed or manually advanced clock for tests and previews. */
export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return new Date(this.current);
  }

  set(date: Date): void {
    this.current = date;
  }
}

/** Random ids that work in Node, browsers and React Native without extra packages. */
export class RandomIdGenerator implements IdGenerator {
  next(): string {
    const time = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `${time}${random}`;
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly prefix = "id") {}

  next(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
}
