/**
 * Every error the domain raises extends DomainError, so adapters (HTTP, UI)
 * can map them to responses with a single `instanceof` check.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Input broke a field rule (bad URL, empty title, rating out of range). */
export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";

  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

/** Input was well-formed but a business rule forbids the action. */
export class BusinessRuleError extends DomainError {
  readonly code = "BUSINESS_RULE";

  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";

  constructor(entity: string, id: string) {
    super(`${entity} "${id}" was not found.`);
  }
}
