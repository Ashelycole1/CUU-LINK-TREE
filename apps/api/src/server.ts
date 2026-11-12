import { Config } from "./config";
import { Container } from "./container";
import { loadEnv } from "./env";
import { API_PREFIX, createApp } from "./http/createApp";

loadEnv();
const config = Config.fromEnv();
const app = createApp(Container.fromConfig(config), config);

app.listen(config.port, () => {
  console.log(`Event Tree API on http://localhost:${config.port}${API_PREFIX}`);
  console.log(config.adminKey ? "Write routes need the x-admin-key header." : "ADMIN_KEY is not set: write routes are open.");
});
