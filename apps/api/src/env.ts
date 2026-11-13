import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Loads local settings with Node's built-in loader (no dotenv package):
 *
 *   1. apps/api/.env   your own overrides (PORT, AUTH_SECRET, ...)
 *   2. .env.local      the Neon variables `neon deploy` / `neon env pull` writes at the repo root
 *
 * A variable that is already set is never overwritten, so real environment
 * variables (Render, Docker) win, then apps/api/.env, then .env.local.
 */
export function loadEnv(): void {
  for (const file of [path.resolve(here, "../.env"), path.resolve(here, "../../../.env.local")]) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
}
