import path from "node:path";
import { fileURLToPath } from "node:url";
import { Config } from "./config";
import { Container } from "./container";
import { createApp } from "./http/createApp";

/**
 * Vercel function entry (bundled by scripts/build-vercel.mjs). Vercel serves
 * the built web app itself and sends /api, /media, /assets and /health here.
 * Settings come from the Vercel project's environment variables. The
 * container (and its Postgres pool) is built once per function instance.
 */
process.env.STATIC_ASSETS_DIR ??= path.join(path.dirname(fileURLToPath(import.meta.url)), "static-assets");

const config = Config.fromEnv();
const container = await Container.fromConfig(config);

export default createApp(container, config);
