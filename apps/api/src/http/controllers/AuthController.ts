import type { Request, Response, Router } from "express";
import type { AuthService } from "@event-tree/core";
import { AuthenticatedController, bearerToken } from "../Controller";

/**
 * /auth: our side of accounts. Sign-up, sign-in and sessions happen in
 * Neon Auth (see authProxy.ts); these routes take the Neon Auth JWT.
 */
export class AuthController extends AuthenticatedController {
  readonly basePath = "/auth";

  constructor(auth: AuthService) {
    super(auth);
  }

  protected register(router: Router): void {
    router.get("/me", this.handle(this.me));
    router.post("/claim", this.handle(this.claim));
    router.get("/username/:username", this.handle(this.checkUsername));
  }

  /** The signed-in person and their page (null until they claim a username). */
  private async me(req: Request, res: Response) {
    res.json(await this.auth.me(bearerToken(req)));
  }

  private async claim(req: Request, res: Response) {
    res.status(201).json(await this.auth.claim(bearerToken(req), req.body ?? {}));
  }

  private async checkUsername(req: Request, res: Response) {
    res.json(await this.auth.isUsernameAvailable(this.param(req, "username")));
  }
}
