import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Loads apps/api/.env if it exists (Node 20.12+ built-in, no dotenv package). */
export function loadEnv(): void {
  const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env");
  if (existsSync(file)) process.loadEnvFile(file);
}
