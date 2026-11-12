/**
 * Loads the demo hosts in demoData.ts into the JSON store.
 *
 *   npm run seed            add the demo data (refuses if accounts exist)
 *   npm run seed -- --force replace all data
 *
 * Demo log-ins: <username>@demo.eventtree.test / demo-password
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { Config } from "../config";
import { Container } from "../container";
import { loadEnv } from "../env";
import { DEMO_HOSTS, DEMO_PASSWORD, demoEmail } from "./demoData";

const DATA_FILES = ["users.json", "profiles.json", "events.json", "reviews.json", "analytics.json"];
const DAY = 86_400_000;

async function main() {
  loadEnv();
  const config = Config.fromEnv();
  if (process.argv.includes("--force")) {
    for (const file of DATA_FILES) await fs.rm(path.join(config.dataDir, file), { force: true });
  }

  const c = Container.fromConfig(config);
  if (await c.repositories.users.findByUsername(DEMO_HOSTS[0]!.username)) {
    console.log(`Demo data already exists in ${config.dataDir}. Run "npm run seed -- --force" to replace it.`);
    return;
  }

  const asset = (p?: string) => (!p ? "" : /^https?:\/\//.test(p) ? p : `${config.publicUrl}/${p}`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const host of DEMO_HOSTS) {
    const { user } = await c.auth.signup({
      email: demoEmail(host.username),
      username: host.username,
      password: DEMO_PASSWORD,
      displayName: host.displayName,
    });
    await c.profiles.updateMine(user.id, { ...host.profile, heroImageUrl: asset(host.profile.heroImageUrl) });

    // Created in reverse so the first event in the list ends up on top.
    for (const e of [...host.events].reverse()) {
      const start = new Date(today.getTime() + e.day * DAY);
      start.setHours(e.startHour);
      const { day: _d, startHour: _s, hours, poster, reviews, ...fields } = e;
      const created = await c.events.create(user.id, {
        ...fields,
        startsAt: start.toISOString(),
        endsAt: new Date(start.getTime() + hours * 3_600_000).toISOString(),
        coverImage: poster ? { url: asset(poster), alt: `${e.title} poster` } : null,
      });
      for (const review of reviews ?? []) if (created.acceptsReviews) await c.reviews.add(created.id, review);
    }
    console.log(`  /${host.username}  (${demoEmail(host.username)} / ${DEMO_PASSWORD})`);
  }
  console.log(`Seeded ${DEMO_HOSTS.length} demo hosts into ${config.dataDir}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
