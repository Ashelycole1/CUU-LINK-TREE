import type { Request, RequestHandler, Response, Router } from "express";
import { Profile, type EventService, type ProfileRepository } from "@event-tree/core";
import { Controller } from "../Controller";

/** /profile and /categories: the header of the tree and its filter chips. */
export class ProfileController extends Controller {
  readonly basePath = "/";

  constructor(
    private readonly profiles: ProfileRepository,
    private readonly events: EventService,
    private readonly requireAdmin: RequestHandler,
  ) {
    super();
  }

  protected register(router: Router): void {
    router.get("/profile", this.handle(this.show));
    router.put("/profile", this.requireAdmin, this.handle(this.replace));
    router.get("/categories", this.handle(this.categories));
  }

  private async show(_req: Request, res: Response) {
    res.json((await this.profiles.get()).toDTO());
  }

  private async replace(req: Request, res: Response) {
    const profile = Profile.create(req.body ?? {});
    await this.profiles.save(profile);
    res.json(profile.toDTO());
  }

  private async categories(_req: Request, res: Response) {
    res.json(await this.events.categories());
  }
}
