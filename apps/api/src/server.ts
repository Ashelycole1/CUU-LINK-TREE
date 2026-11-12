import { Config } from "./config";
import { Container } from "./container";
import { loadEnv } from "./env";
import { API_PREFIX, createApp } from "./http/createApp";

loadEnv();
const config = Config.fromEnv();
const app = createApp(Container.fromConfig(config), config);

app.listen(config.port, () => {
  console.log(`Event Tree API on http://localhost:${config.port}${API_PREFIX}`);
  if (config.usingDevSecret) console.warn("AUTH_SECRET is not set: using a development secret. Set it before deploying.");
});
