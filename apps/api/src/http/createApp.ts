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
export function createApp(c: Container, config: Pick<Config, "corsOrigins" | "staticAssetsDir">): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: config.corsOrigins === "*" ? true : config.corsOrigins }));
  app.use(express.json({ limit: "100kb" }));

  // Poster images that ship with the repo (used by the demo pages).
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

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
