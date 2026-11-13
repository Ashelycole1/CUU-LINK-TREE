import path from "node:path";
import cors from "cors";
import express, { type Express } from "express";
import type { Config } from "../config";
import type { Container } from "../container";
import type { Controller } from "./Controller";
import { AuthController } from "./controllers/AuthController";
import { DashboardController } from "./controllers/DashboardController";
import { EventController } from "./controllers/EventController";
import { MediaController } from "./controllers/MediaController";
import { PublicPageController } from "./controllers/PublicPageController";
import { errorHandler, notFound } from "./middleware";
import { mountAuthProxy } from "./authProxy";
import { MEDIA_KEY } from "../infrastructure/media";

export const API_PREFIX = "/api/v1";

/** Builds the Express app. Pure: it does not listen, so tests can mount it on a random port. */
export function createApp(
  c: Container,
  config: Pick<Config, "corsOrigins" | "staticAssetsDir" | "publicUrl"> & Partial<Pick<Config, "webDistDir" | "auth">>,
): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(cors({ origin: config.corsOrigins === "*" ? true : config.corsOrigins, credentials: true }));

  // Neon Auth on our own origin (before the JSON parser: bodies pass through untouched).
  if (config.auth) mountAuthProxy(app, { baseUrl: config.auth.baseUrl, publicUrl: config.publicUrl });

  app.use(express.json({ limit: "100kb" }));

  // Poster images that ship with the repo (used by the local demo pages).
  app.use("/assets", express.static(config.staticAssetsDir, { maxAge: "7d" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, time: c.clock.now().toISOString() });
  });

  // Uploaded images, streamed from Neon Object Storage. Keys are unique per
  // upload, so responses can be cached forever.
  app.get(/^\/media\/(.+)$/, async (req, res, next) => {
    try {
      const key = String(req.params[0] ?? "");
      const media = MEDIA_KEY.test(key) ? await c.media.get(key) : null;
      if (!media) {
        res.status(404).json({ error: { code: "NOT_FOUND", message: "No such image." } });
        return;
      }
      res.set({
        "Content-Type": media.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
        "Cross-Origin-Resource-Policy": "cross-origin",
      });
      if (media.size !== undefined) res.set("Content-Length", String(media.size));
      media.body.on("error", next).pipe(res);
    } catch (error) {
      next(error);
    }
  });

  const controllers: Controller[] = [
    new AuthController(c.auth),
    new DashboardController(c.auth, c.events, c.profiles, c.analytics),
    new PublicPageController(c.events, c.analytics, c.profiles),
    new EventController(c.events, c.reviews, c.analytics),
    new MediaController(c.auth, c.events, c.media, config.publicUrl),
  ];
  for (const controller of controllers) {
    app.use(`${API_PREFIX}${controller.basePath === "/" ? "" : controller.basePath}`, controller.router());
  }

  // The built web app on the same origin, so one deployment serves
  // https://<host>/ (landing), /<username> pages and /api/v1.
  if (config.webDistDir) {
    const dist = config.webDistDir;
    app.use(
      express.static(dist, {
        index: false,
        // Vite fingerprints files under assets/, so they can be cached forever.
        setHeaders: (res, file) =>
          res.set("Cache-Control", file.includes(`${path.sep}assets${path.sep}`) ? "public, max-age=31536000, immutable" : "no-cache"),
      }),
    );
    app.get(/^(?!\/api\/|\/assets\/|\/media\/|\/health$).*/, (_req, res) => {
      res.set("Cache-Control", "no-cache").sendFile(path.join(dist, "index.html"));
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
