import type { Request, Response, Router } from "express";
import type { ReviewService } from "@event-tree/core";
import { Controller } from "../Controller";

/** /events/:id/reviews: read and leave reviews for an event. */
export class ReviewController extends Controller {
  readonly basePath = "/events/:id/reviews";

  constructor(private readonly reviews: ReviewService) {
    super();
  }

  protected register(router: Router): void {
    router.get("/", this.handle(this.list));
    router.get("/summary", this.handle(this.summary));
    router.post("/", this.handle(this.create));
  }

  private async list(req: Request, res: Response) {
    res.json(await this.reviews.list(this.param(req, "id")));
  }

  private async summary(req: Request, res: Response) {
    res.json(await this.reviews.summary(this.param(req, "id")));
  }

  private async create(req: Request, res: Response) {
    res.status(201).json(await this.reviews.add(this.param(req, "id"), req.body ?? {}));
  }
}
