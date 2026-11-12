import type { Request, Response, Router } from "express";
import type { AnalyticsService, AuthService, EventService, ProfileService } from "@event-tree/core";
import { AuthenticatedController } from "../Controller";

/**
 * /me: the logged-in host's dashboard. Every route resolves the user from
 * the bearer token first, and services check ownership of each event.
 */
export class DashboardController extends AuthenticatedController {
  readonly basePath = "/me";

  constructor(
    auth: AuthService,
    private readonly events: EventService,
    private readonly profiles: ProfileService,
    private readonly analytics: AnalyticsService,
  ) {
    super(auth);
  }

  protected register(router: Router): void {
    router.get("/profile", this.handle(this.getProfile));
    router.patch("/profile", this.handle(this.updateProfile));
    router.get("/events", this.handle(this.listEvents));
    router.post("/events", this.handle(this.createEvent));
    router.put("/events/order", this.handle(this.reorder));
    router.patch("/events/:eventId", this.handle(this.updateEvent));
    router.delete("/events/:eventId", this.handle(this.deleteEvent));
    router.get("/analytics", this.handle(this.getAnalytics));
  }

  private async getProfile(req: Request, res: Response) {
    const user = await this.currentUser(req);
    res.json(await this.profiles.getMine(user.id));
  }

  private async updateProfile(req: Request, res: Response) {
    const user = await this.currentUser(req);
    res.json(await this.profiles.updateMine(user.id, req.body ?? {}));
  }

  private async listEvents(req: Request, res: Response) {
    const user = await this.currentUser(req);
    res.json(await this.events.listMine(user.id));
  }

  private async createEvent(req: Request, res: Response) {
    const user = await this.currentUser(req);
    res.status(201).json(await this.events.create(user.id, req.body ?? {}));
  }

  private async reorder(req: Request, res: Response) {
    const user = await this.currentUser(req);
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    res.json(await this.events.reorder(user.id, ids));
  }

  private async updateEvent(req: Request, res: Response) {
    const user = await this.currentUser(req);
    res.json(await this.events.update(user.id, this.param(req, "eventId"), req.body ?? {}));
  }

  private async deleteEvent(req: Request, res: Response) {
    const user = await this.currentUser(req);
    await this.events.remove(user.id, this.param(req, "eventId"));
    res.status(204).end();
  }

  private async getAnalytics(req: Request, res: Response) {
    const user = await this.currentUser(req);
    res.json(await this.analytics.summary(user.id, Number(req.query.days ?? 14)));
  }
}
