import path from "node:path";
import cors from "cors";
import express, { type Express } from "express";
import type { Config } from "../config";
import type { Container } from "../container";
import type { Controller } from "./Controller";
import { AuthController } from "./controllers/AuthController";
import { DashboardController } from "./controllers/DashboardController";
import { EventController } from "./controllers/EventController";
import { PublicPageController } from "./controllers/PublicPageController";
import { errorHandler, notFound } from "./middleware";

export const API_PREFIX = "/api/v1";

/** Builds the Express app. Pure: it does not listen, so tests can mount it on a random port. */
export function createApp(
  c: Container,
  config: Pick<Config, "corsOrigins" | "staticAssetsDir"> & Partial<Pick<Config, "webDistDir">>,
): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(cors({ origin: config.corsOrigins === "*" ? true : config.corsOrigins }));
  app.use(express.json({ limit: "100kb" }));

  // Poster images that ship with the repo (used by the local demo pages).
  app.use("/assets", express.static(config.staticAssetsDir, { maxAge: "7d" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, time: c.clock.now().toISOString() });
  });

  const controllers: Controller[] = [
    new AuthController(c.auth),
    new DashboardController(c.auth, c.events, c.profiles, c.analytics),
    new PublicPageController(c.events, c.analytics, c.profiles),
    new EventController(c.events, c.reviews, c.analytics),
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
    app.get(/^(?!\/api\/|\/assets\/|\/health$).*/, (_req, res) => {
      res.set("Cache-Control", "no-cache").sendFile(path.join(dist, "index.html"));
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
