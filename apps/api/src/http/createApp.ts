import cors from "cors";
import express, { type Express } from "express";
import type { Config } from "../config";
import type { Container } from "../container";
import type { Controller } from "./Controller";
import { EventController } from "./controllers/EventController";
import { ProfileController } from "./controllers/ProfileController";
import { ReviewController } from "./controllers/ReviewController";
import { adminGuard, errorHandler, notFound } from "./middleware";

export const API_PREFIX = "/api/v1";

/** Builds the Express app. Pure: it does not listen, so tests can mount it on a random port. */
export function createApp(container: Container, config: Pick<Config, "adminKey" | "corsOrigins" | "staticAssetsDir">): Express {
  const app = express();
  const requireAdmin = adminGuard(config.adminKey);

  app.disable("x-powered-by");
  app.use(cors({ origin: config.corsOrigins === "*" ? true : config.corsOrigins }));
  app.use(express.json({ limit: "100kb" }));

  // Poster images that ship with the repo (used by the seed data).
  app.use("/assets", express.static(config.staticAssetsDir, { maxAge: "7d" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, time: container.clock.now().toISOString() });
  });

  const controllers: Controller[] = [
    new ProfileController(container.repositories.profile, container.eventService, requireAdmin),
    // Reviews are mounted before events so "/events/:id/reviews" is not caught by "/events/:id".
    new ReviewController(container.reviewService),
    new EventController(container.eventService, requireAdmin),
  ];
  for (const controller of controllers) {
    const path = `${API_PREFIX}${controller.basePath === "/" ? "" : controller.basePath}`;
    app.use(path, controller.router());
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
