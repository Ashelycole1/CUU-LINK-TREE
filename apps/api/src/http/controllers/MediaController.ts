import express, { type Request, type Response, type Router } from "express";
import type { AuthService, EventService } from "@event-tree/core";
import { AuthenticatedController } from "../Controller";
import { MAX_IMAGE_BYTES, mediaKey, sniffImage, type MediaStore } from "../../infrastructure/media";

/** Raw image bodies (the client sends the file itself, with its image/* type). */
const rawImage = express.raw({ type: () => true, limit: MAX_IMAGE_BYTES + 1 });

/**
 * Image uploads into Neon Object Storage. The bucket stays private: images
 * are served back through GET /media/<key> on our own origin, and the
 * database stores that address like any other image link.
 */
export class MediaController extends AuthenticatedController {
  readonly basePath = "/";

  constructor(
    auth: AuthService,
    private readonly events: EventService,
    private readonly media: MediaStore,
    private readonly publicUrl: string,
  ) {
    super(auth);
  }

  protected register(router: Router): void {
    router.post("/me/uploads", rawImage, this.handle(this.uploadForHost));
    router.post("/events/:id/photos", rawImage, this.handle(this.uploadEventPhoto));
  }

  private bytes(req: Request): Uint8Array {
    return Buffer.isBuffer(req.body) ? new Uint8Array(req.body) : new Uint8Array();
  }

  private url(key: string): string {
    return `${this.publicUrl}/media/${key}`;
  }

  /** A host's avatar, header image or poster. Returns { url } to save on the profile or event. */
  private async uploadForHost(req: Request, res: Response) {
    const user = await this.currentUser(req);
    const bytes = this.bytes(req);
    const { type, ext } = sniffImage(bytes);
    const key = mediaKey(`u/${user.id}`, ext);
    await this.media.put(key, bytes, type);
    res.status(201).json({ url: this.url(key) });
  }

  /** A visitor's photo for an event's gallery; ?caption= is optional. Returns the updated event. */
  private async uploadEventPhoto(req: Request, res: Response) {
    const eventId = this.param(req, "id");
    const bytes = this.bytes(req);
    const { type, ext } = sniffImage(bytes);
    const key = mediaKey(`e/${eventId}`, ext);
    await this.media.put(key, bytes, type);
    try {
      const caption = typeof req.query.caption === "string" ? req.query.caption : "";
      res.status(201).json(await this.events.addImage(eventId, { url: this.url(key), caption }));
    } catch (error) {
      // Unknown or hidden event: don't keep an orphaned file.
      await this.media.delete(key).catch(() => undefined);
      throw error;
    }
  }
}
