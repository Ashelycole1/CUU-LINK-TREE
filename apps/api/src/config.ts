import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neonAuth, neonDatabase, neonStorage, type NeonAuthSettings, type NeonStorageSettings } from "./infrastructure/neonEnv";

const here = path.dirname(fileURLToPath(import.meta.url));

/** The bucket declared in neon.ts that holds uploaded images. */
export const MEDIA_BUCKET = "assets";

/** Typed, validated settings read once from the environment. */
export class Config {
  private constructor(
    readonly production: boolean,
    readonly port: number,
    readonly publicUrl: string,
    /** Pooled Neon Postgres connection string. When empty, data lives in JSON files under dataDir (development only). */
    readonly databaseUrl: string,
    /** Direct (unpooled) connection string, used for schema migrations. */
    readonly migrationUrl: string,
    readonly dataDir: string,
    readonly corsOrigins: string[] | "*",
    /** Neon Auth (Managed Better Auth). Without it nobody can sign in. */
    readonly auth: NeonAuthSettings | null,
    /** Neon Object Storage. Without it, development keeps uploads in dataDir/media. */
    readonly storage: NeonStorageSettings | null,
    readonly mediaBucket: string,
    readonly staticAssetsDir: string,
    /** The built web app (apps/web/dist). Served on the same origin when it exists. */
    readonly webDistDir: string | null,
  ) {}

  static fromEnv(env: NodeJS.ProcessEnv = process.env): Config {
    const production = env.NODE_ENV === "production";
    const port = Number(env.PORT ?? 4000);
    if (!Number.isInteger(port) || port <= 0) throw new Error(`PORT must be a positive integer, got "${env.PORT}".`);

    const db = neonDatabase(env);
    const auth = neonAuth(env);
    const storage = neonStorage(env);
    const publicUrl = (env.PUBLIC_URL?.trim() || (production ? "" : `http://localhost:${port}`)).replace(/\/+$/, "");
    if (production) {
      const missing = [
        !db && "DATABASE_URL (Neon Postgres)",
        !auth && "NEON_AUTH_BASE_URL and NEON_AUTH_JWKS_URL (Neon Auth)",
        !storage && "AWS_* (Neon Object Storage)",
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
      db?.pooledUrl ?? "",
      db?.directUrl ?? "",
      path.resolve(here, "..", env.DATA_DIR ?? "./data"),
      origins === "*" ? "*" : origins.split(",").map((o) => o.trim()).filter(Boolean),
      auth,
      storage,
      env.MEDIA_BUCKET?.trim() || MEDIA_BUCKET,
      path.resolve(here, "../../static/assets"),
      existsSync(path.join(webDist, "index.html")) ? webDist : null,
    );
  }
}
