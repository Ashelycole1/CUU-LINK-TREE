import type { Request, Response, Router } from "express";
import type { AuthService } from "@event-tree/core";
import { AuthenticatedController } from "../Controller";

/** /auth: sign up, log in, check a username, and read the current session. */
export class AuthController extends AuthenticatedController {
  readonly basePath = "/auth";

  constructor(auth: AuthService) {
    super(auth);
  }

  protected register(router: Router): void {
    router.post("/signup", this.handle(this.signup));
    router.post("/login", this.handle(this.login));
    router.get("/me", this.handle(this.me));
    router.get("/username/:username", this.handle(this.checkUsername));
  }

  private async signup(req: Request, res: Response) {
    res.status(201).json(await this.auth.signup(req.body ?? {}));
  }

  private async login(req: Request, res: Response) {
    res.json(await this.auth.login(req.body ?? {}));
  }

  private async me(req: Request, res: Response) {
    res.json(await this.currentUser(req));
  }

  private async checkUsername(req: Request, res: Response) {
    res.json(await this.auth.isUsernameAvailable(this.param(req, "username")));
  }
}
