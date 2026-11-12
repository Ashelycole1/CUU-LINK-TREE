import { Router, type NextFunction, type Request, type RequestHandler, type Response } from "express";
import type { AuthService, UserDTO } from "@event-tree/core";

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

/**
 * Base class for HTTP controllers. A subclass declares its routes in
 * `register()`; the base class builds the Router and forwards every
 * rejected promise to Express's error handler.
 */
export abstract class Controller {
  /** Path prefix, relative to the API root (e.g. "/events"). */
  abstract readonly basePath: string;

  protected abstract register(router: Router): void;

  router(): Router {
    // mergeParams lets nested paths like "/events/:id/reviews" read :id.
    const router = Router({ mergeParams: true });
    this.register(router);
    return router;
  }

  protected handle(fn: AsyncHandler): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      fn.call(this, req, res).catch(next);
    };
  }

  protected param(req: Request, name: string): string {
    return String(req.params[name] ?? "");
  }
}

/** A controller whose routes need a logged-in user. */
export abstract class AuthenticatedController extends Controller {
  protected constructor(protected readonly auth: AuthService) {
    super();
  }

  /** Resolves `Authorization: Bearer <token>`; throws UnauthorizedError (401) otherwise. */
  protected currentUser(req: Request): Promise<UserDTO> {
    return this.auth.authenticate(bearerToken(req));
  }
}

export function bearerToken(req: Request): string | null {
  const header = req.header("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}
