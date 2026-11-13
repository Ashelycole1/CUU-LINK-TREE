/**
 * Loads the demo hosts in demoData.ts into the local JSON store. For local
 * development only: it refuses to run in production or against Postgres,
 * so a live deployment always starts empty.
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
import type { AnalyticsRecord } from "@event-tree/core";
import { DEMO_HOSTS, DEMO_PASSWORD, demoEmail } from "./demoData";

const DATA_FILES = ["users.json", "profiles.json", "events.json", "reviews.json", "analytics.json"];
const DAY = 86_400_000;

async function main() {
  loadEnv();
  const config = Config.fromEnv();
  if (config.production || config.databaseUrl) {
    throw new Error("The demo seed is for local development only. Unset NODE_ENV=production and DATABASE_URL to use it.");
  }
  if (process.argv.includes("--force")) {
    for (const file of DATA_FILES) await fs.rm(path.join(config.dataDir, file), { force: true });
  }

  const c = await Container.fromConfig(config);
  if (await c.repositories.users.findByUsername(DEMO_HOSTS[0]!.username)) {
    console.log(`Demo data already exists in ${config.dataDir}. Run "npm run seed -- --force" to replace it.`);
    return;
  }

  const asset = (p?: string) => (!p ? "" : /^https?:\/\//.test(p) ? p : `${config.publicUrl}/${p}`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const traffic: AnalyticsRecord[] = [];

  for (const [hostIndex, host] of DEMO_HOSTS.entries()) {
    const { user } = await c.auth.signup({
      email: demoEmail(host.username),
      username: host.username,
      password: DEMO_PASSWORD,
      displayName: host.displayName,
    });
    await c.profiles.updateMine(user.id, { ...host.profile, heroImageUrl: asset(host.profile.heroImageUrl) });

    const eventIds: string[] = [];
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
      eventIds.push(created.id);
      for (const review of reviews ?? []) if (created.acceptsReviews) await c.reviews.add(created.id, review);
    }
    traffic.push(...demoTraffic(user.id, [...eventIds].reverse(), today, hostIndex + 1));
    console.log(`  /${host.username}  (${demoEmail(host.username)} / ${DEMO_PASSWORD})`);
  }
  // Written in one go: adding hundreds of records one at a time rewrites the file each time.
  await fs.writeFile(path.join(config.dataDir, "analytics.json"), JSON.stringify(traffic, null, 2));
  console.log(`Seeded ${DEMO_HOSTS.length} demo hosts into ${config.dataDir}.`);
}

/**
 * 30 days of made-up views and clicks so the Analytics screen has a shape to
 * show. Uses a fixed-seed random generator so every seed run gives the same numbers.
 */
function demoTraffic(ownerId: string, eventIds: string[], today: Date, seed: number): AnalyticsRecord[] {
  let state = seed * 9_301 + 49_297;
  const random = () => ((state = (state * 9_301 + 49_297) % 233_280) / 233_280);
  const records: AnalyticsRecord[] = [];
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const day = today.getTime() - daysAgo * DAY;
    const weekend = [0, 6].includes(new Date(day).getDay());
    const views = Math.round((18 + (29 - daysAgo) * 0.9) * (weekend ? 1.5 : 1) * (0.7 + random() * 0.6));
    for (let v = 0; v < views; v++) {
      const at = new Date(day + Math.floor(random() * DAY)).toISOString();
      records.push({ id: `seed-${ownerId}-v${daysAgo}-${v}`, ownerId, type: "view", eventId: null, at });
      if (eventIds.length && random() < 0.42) {
        // Earlier events in the list get more taps, as on a real page.
        const eventId = eventIds[Math.floor(random() ** 1.8 * eventIds.length)]!;
        records.push({ id: `seed-${ownerId}-c${daysAgo}-${v}`, ownerId, type: "click", eventId, at });
      }
    }
  }
  return records;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
