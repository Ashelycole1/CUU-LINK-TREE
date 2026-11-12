import type { Request, Response, Router } from "express";
import type { AnalyticsService, EventListQuery, EventService, ProfileService } from "@event-tree/core";
import { Controller } from "../Controller";

/** /pages/:username: a host's public page, its events, and page-view tracking. Plus the theme gallery. */
export class PublicPageController extends Controller {
  readonly basePath = "/";

  constructor(
    private readonly events: EventService,
    private readonly analytics: AnalyticsService,
    private readonly profiles: ProfileService,
  ) {
    super();
  }

  protected register(router: Router): void {
    router.get("/themes", this.handle(this.themes));
    router.get("/pages/:username", this.handle(this.tree));
    router.get("/pages/:username/events", this.handle(this.list));
    router.get("/pages/:username/events/:slug", this.handle(this.show));
    router.post("/pages/:username/views", this.handle(this.view));
  }

  private async themes(_req: Request, res: Response) {
    res.json(this.profiles.themes());
  }

  private async tree(req: Request, res: Response) {
    res.json(await this.events.tree(this.param(req, "username")));
  }

  private async list(req: Request, res: Response) {
    const q = req.query;
    const when = ["upcoming", "past", "all"].includes(String(q.when)) ? (String(q.when) as EventListQuery["when"]) : "all";
    res.json(
      await this.events.listPublic(this.param(req, "username"), {
        when,
        category: typeof q.category === "string" ? q.category : undefined,
        q: typeof q.q === "string" ? q.q : undefined,
        limit: q.limit ? Number(q.limit) : undefined,
      }),
    );
  }

  private async show(req: Request, res: Response) {
    res.json(await this.events.getPublic(this.param(req, "username"), this.param(req, "slug")));
  }

  private async view(req: Request, res: Response) {
    await this.analytics.recordView(this.param(req, "username"));
    res.status(204).end();
  }
}
