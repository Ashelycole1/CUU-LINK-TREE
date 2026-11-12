import type { Request, Response, Router } from "express";
import type { AnalyticsService, EventService, ReviewService } from "@event-tree/core";
import { Controller } from "../Controller";

/** /events/:id: what any visitor can do with a visible event: reviews, photos, click tracking. */
export class EventController extends Controller {
  readonly basePath = "/events/:id";

  constructor(
    private readonly events: EventService,
    private readonly reviews: ReviewService,
    private readonly analytics: AnalyticsService,
  ) {
    super();
  }

  protected register(router: Router): void {
    router.get("/reviews", this.handle(this.listReviews));
    router.get("/reviews/summary", this.handle(this.summary));
    router.post("/reviews", this.handle(this.addReview));
    router.post("/images", this.handle(this.addImage));
    router.post("/clicks", this.handle(this.click));
  }

  private async listReviews(req: Request, res: Response) {
    res.json(await this.reviews.list(this.param(req, "id")));
  }

  private async summary(req: Request, res: Response) {
    res.json(await this.reviews.summary(this.param(req, "id")));
  }

  private async addReview(req: Request, res: Response) {
    res.status(201).json(await this.reviews.add(this.param(req, "id"), req.body ?? {}));
  }

  private async addImage(req: Request, res: Response) {
    res.status(201).json(await this.events.addImage(this.param(req, "id"), req.body ?? {}));
  }

  private async click(req: Request, res: Response) {
    await this.analytics.recordClick(this.param(req, "id"));
    res.status(204).end();
  }
}
