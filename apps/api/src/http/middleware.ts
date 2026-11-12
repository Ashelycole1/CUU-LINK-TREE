import { timingSafeEqual } from "node:crypto";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { BusinessRuleError, DomainError, NotFoundError, ValidationError } from "@event-tree/core";

/** Body shape for every error response: `{ error: { code, message, field? } }`. */
export interface ErrorBody {
  error: { code: string; message: string; field?: string };
}

/**
 * Maps domain errors to HTTP status codes. Anything else is a bug: it is
 * logged and the client gets a generic 500 without internals.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof DomainError) {
    const status =
      err instanceof NotFoundError ? 404 : err instanceof ValidationError ? 400 : err instanceof BusinessRuleError ? 409 : 400;
    const body: ErrorBody = { error: { code: err.code, message: err.message } };
    if (err instanceof ValidationError && err.field) body.error.field = err.field;
    res.status(status).json(body);
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

/**
 * Guards write routes when ADMIN_KEY is set. With no key configured the
 * API is open, which suits local development and trusted campus networks.
 */
export function adminGuard(adminKey: string | null): RequestHandler {
  return (req, res, next) => {
    if (!adminKey) return next();
    const given = Buffer.from(String(req.header("x-admin-key") ?? ""));
    const expected = Buffer.from(adminKey);
    if (given.length === expected.length && timingSafeEqual(given, expected)) return next();
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "A valid x-admin-key header is required." } });
  };
}
