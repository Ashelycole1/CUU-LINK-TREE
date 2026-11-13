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
  console.log(`Storage: ${config.databaseUrl ? "Postgres" : `JSON files in ${config.dataDir}`}`);
  console.log(config.webDistDir ? `Serving the web app from ${config.webDistDir}` : "Web app not built: run npm run build:web to serve it here.");
  if (config.usingDevSecret) console.warn("AUTH_SECRET is not set: using a development secret. Set it before deploying.");
});
