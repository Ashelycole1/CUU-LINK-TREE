import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DEV_SECRET = "dev-only-secret-change-me-before-deploying";

/** Typed, validated settings read once from the environment. */
export class Config {
  private constructor(
    readonly production: boolean,
    readonly port: number,
    readonly publicUrl: string,
    /** Postgres connection string. When empty, data lives in JSON files under dataDir (development only). */
    readonly databaseUrl: string,
    readonly dataDir: string,
    readonly corsOrigins: string[] | "*",
    readonly authSecret: string,
    readonly usingDevSecret: boolean,
    readonly staticAssetsDir: string,
    /** The built web app (apps/web/dist). Served on the same origin when it exists. */
    readonly webDistDir: string | null,
  ) {}

  static fromEnv(env: NodeJS.ProcessEnv = process.env): Config {
    const production = env.NODE_ENV === "production";
    const port = Number(env.PORT ?? 4000);
    if (!Number.isInteger(port) || port <= 0) throw new Error(`PORT must be a positive integer, got "${env.PORT}".`);

    const secret = env.AUTH_SECRET?.trim() ?? "";
    const databaseUrl = env.DATABASE_URL?.trim() ?? "";
    const publicUrl = (env.PUBLIC_URL?.trim() || (production ? "" : `http://localhost:${port}`)).replace(/\/+$/, "");
    if (production) {
      const missing = [
        secret.length < 32 && "AUTH_SECRET (32+ random characters)",
        !databaseUrl && "DATABASE_URL (Postgres)",
        !/^https:\/\//.test(publicUrl) && "PUBLIC_URL (the https:// address people visit)",
      ].filter(Boolean);
      if (missing.length) throw new Error(`Missing production settings: ${missing.join(", ")}.`);
    }

    // Default CORS: anything in development; only our own origin in production.
    const origins = (env.CORS_ORIGINS ?? (production ? publicUrl : "*")).trim();
    const webDist = path.resolve(here, "../../web/dist");

    return new Config(
      production,
      port,
      publicUrl,
      databaseUrl,
      path.resolve(here, "..", env.DATA_DIR ?? "./data"),
      origins === "*" ? "*" : origins.split(",").map((o) => o.trim()).filter(Boolean),
      secret || DEV_SECRET,
      !secret,
      path.resolve(here, "../../static/assets"),
      existsSync(path.join(webDist, "index.html")) ? webDist : null,
    );
  }
}
