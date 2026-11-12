/** A failed API call, carrying the server's error code and, for 429s, how long to wait. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly field?: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidation(): boolean {
    return this.status === 400;
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }
}
