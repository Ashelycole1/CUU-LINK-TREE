import { Config } from "./config";
import { Container } from "./container";
import { loadEnv } from "./env";
import { API_PREFIX, createApp } from "./http/createApp";

loadEnv();
const config = Config.fromEnv();
const container = await Container.fromConfig(config);
const app = createApp(container, config);

app.listen(config.port, () => {
  console.log(`Event Tree API on ${config.publicUrl}${API_PREFIX} (port ${config.port})`);
  console.log(`Database: ${config.databaseUrl ? "Neon Postgres" : `JSON files in ${config.dataDir}`}`);
  console.log(`Sign-in: ${config.auth ? "Neon Auth, proxied at /api/auth" : "not configured (set NEON_AUTH_BASE_URL); nobody can sign in"}`);
  console.log(`Images: ${container.media.kind}`);
  console.log(config.webDistDir ? `Serving the web app from ${config.webDistDir}` : "Web app not built: run npm run build:web to serve it here.");
});
