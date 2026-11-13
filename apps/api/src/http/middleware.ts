import type { ErrorRequestHandler, RequestHandler } from "express";
import {
  BusinessRuleError,
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  PageRequiredError,
  UnauthorizedError,
  ValidationError,
} from "@event-tree/core";

/** Body shape for every error response: `{ error: { code, message, field? } }`. */
export interface ErrorBody {
  error: { code: string; message: string; field?: string };
}

/** Each domain error class maps to one HTTP status. Order matters only for readability. */
const STATUS: [new (...args: never[]) => DomainError, number][] = [
  [ValidationError, 400],
  [UnauthorizedError, 401],
  [ForbiddenError, 403],
  [PageRequiredError, 403],
  [NotFoundError, 404],
  [ConflictError, 409],
  [BusinessRuleError, 409],
];

/**
 * Maps domain errors to HTTP responses. Anything else is a bug: it is
 * logged and the client gets a generic 500 without internals.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof DomainError) {
    const status = STATUS.find(([type]) => err instanceof type)?.[1] ?? 400;
    const body: ErrorBody = { error: { code: err.code, message: err.message } };
    const field = (err as { field?: string }).field;
    if (field) body.error.field = field;
    res.status(status).json(body);
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: { code: "TOO_LARGE", message: "That file is too big. Images can be up to 5 MB." } });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "BAD_JSON", message: "The request body is not valid JSON." } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong on our side." } });
};

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}.` } });
};
