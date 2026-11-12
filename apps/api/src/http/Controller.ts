import { Router, type NextFunction, type Request, type RequestHandler, type Response } from "express";

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

/**
 * Base class for HTTP controllers. A subclass declares its routes in
 * `register()`; the base class builds the Router and forwards every
 * rejected promise to Express's error handler, so handlers never need
 * their own try/catch.
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
