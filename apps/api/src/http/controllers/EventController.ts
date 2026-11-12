import type { Request, RequestHandler, Response, Router } from "express";
import type { EventListQuery, EventService } from "@event-tree/core";
import { Controller } from "../Controller";

/** /events: list, read, post, edit and delete events, and add gallery images. */
export class EventController extends Controller {
  readonly basePath = "/events";

  constructor(
    private readonly events: EventService,
    private readonly requireAdmin: RequestHandler,
  ) {
    super();
  }

  protected register(router: Router): void {
    router.get("/", this.handle(this.list));
    router.get("/:id", this.handle(this.show));
    router.post("/", this.requireAdmin, this.handle(this.create));
    router.patch("/:id", this.requireAdmin, this.handle(this.update));
    router.delete("/:id", this.requireAdmin, this.handle(this.destroy));
    router.post("/:id/images", this.handle(this.addImage));
  }

  private async list(req: Request, res: Response) {
    const q = req.query;
    const when = ["upcoming", "past", "all"].includes(String(q.when)) ? (String(q.when) as EventListQuery["when"]) : "all";
    res.json(
      await this.events.list({
        when,
        category: typeof q.category === "string" ? q.category : undefined,
        q: typeof q.q === "string" ? q.q : undefined,
        limit: q.limit ? Number(q.limit) : undefined,
      }),
    );
  }

  private async show(req: Request, res: Response) {
    res.json(await this.events.get(this.param(req, "id")));
  }

  private async create(req: Request, res: Response) {
    const event = await this.events.create(req.body ?? {});
    res.status(201).location(`${req.baseUrl}/${event.slug}`).json(event);
  }

  private async update(req: Request, res: Response) {
    res.json(await this.events.update(this.param(req, "id"), req.body ?? {}));
  }

  private async destroy(req: Request, res: Response) {
    await this.events.remove(this.param(req, "id"));
    res.status(204).end();
  }

  private async addImage(req: Request, res: Response) {
    res.status(201).json(await this.events.addImage(this.param(req, "id"), req.body ?? {}));
  }
}
