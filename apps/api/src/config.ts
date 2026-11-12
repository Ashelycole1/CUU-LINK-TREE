import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DEV_SECRET = "dev-only-secret-change-me-before-deploying";

/** Typed, validated settings read once from the environment. */
export class Config {
  private constructor(
    readonly port: number,
    readonly publicUrl: string,
    readonly dataDir: string,
    readonly corsOrigins: string[] | "*",
    readonly authSecret: string,
    readonly usingDevSecret: boolean,
    readonly staticAssetsDir: string,
  ) {}

  static fromEnv(env: NodeJS.ProcessEnv = process.env): Config {
    const port = Number(env.PORT ?? 4000);
    if (!Number.isInteger(port) || port <= 0) throw new Error(`PORT must be a positive integer, got "${env.PORT}".`);
    const origins = (env.CORS_ORIGINS ?? "*").trim();
    const secret = env.AUTH_SECRET?.trim();
    if (!secret && env.NODE_ENV === "production") throw new Error("Set AUTH_SECRET (32+ random characters) in production.");
    return new Config(
      port,
      (env.PUBLIC_URL ?? `http://localhost:${port}`).replace(/\/+$/, ""),
      path.resolve(here, "..", env.DATA_DIR ?? "./data"),
      origins === "*" ? "*" : origins.split(",").map((o) => o.trim()).filter(Boolean),
      secret || DEV_SECRET,
      !secret,
      path.resolve(here, "../../static/assets"),
    );
  }
}
