/**
 * Loads sample data into the JSON store.
 *
 * The events come straight from apps/static/events.js, so the zero-build
 * page and the API share one source of sample data. Placeholder links
 * ("#") are skipped because the domain only accepts real http(s) links.
 *
 *   npm run seed            add the sample data (refuses if data exists)
 *   npm run seed -- --force replace existing data
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import {
  Profile,
  type CreateEventInput,
  type EventLinkKind,
  type SocialLinkDTO,
} from "@event-tree/core";
import { Config } from "../config";
import { Container } from "../container";
import { loadEnv } from "../env";

interface StaticLink {
  label: string;
  url: string;
  primary?: boolean;
}
interface StaticEvent {
  id: string;
  title: string;
  emoji?: string;
  category: string;
  organizer?: string;
  start: string;
  end: string;
  venue?: string;
  description?: string;
  image?: string;
  links?: StaticLink[];
}
interface StaticProfile {
  name: string;
  handle?: string;
  tagline?: string;
  avatarText?: string;
  hero?: string;
  socials?: { type: string; url: string }[];
}

const here = path.dirname(fileURLToPath(import.meta.url));
const STATIC_DATA = path.resolve(here, "../../../static/events.js");

const SAMPLE_REVIEWS: Record<string, { authorName: string; rating: number; comment: string }[]> = {
  "research-week": [
    { authorName: "Sample: Grace N.", rating: 5, comment: "The poster session was packed. Great feedback from the judges." },
    { authorName: "Sample: Daniel K.", rating: 4, comment: "Good talks. The afternoon ran a little late." },
  ],
  "inter-faculty-games": [{ authorName: "Sample: Faith A.", rating: 5, comment: "Best atmosphere of the semester." }],
};

/** Guesses a link kind from its label, the way Linktree infers a type from a URL. */
function kindFor(label: string): EventLinkKind {
  const l = label.toLowerCase();
  if (/regist|rsvp|sign ?up/.test(l)) return "register";
  if (/ticket/.test(l)) return "tickets";
  if (/agenda|schedule|rules|tracks/.test(l)) return "agenda";
  if (/live|stream/.test(l)) return "livestream";
  if (/slide/.test(l)) return "slides";
  if (/photo|gallery/.test(l)) return "photos";
  if (/record|video/.test(l)) return "recording";
  return "other";
}

const isRealUrl = (url: string) => /^https?:\/\//i.test(url);

async function loadStaticData(): Promise<{ profile: StaticProfile; events: StaticEvent[] }> {
  const sandbox = { window: {} as { CUU_PROFILE?: StaticProfile; CUU_EVENTS?: StaticEvent[] } };
  vm.runInNewContext(await fs.readFile(STATIC_DATA, "utf8"), sandbox, { filename: STATIC_DATA, timeout: 1000 });
  if (!sandbox.window.CUU_PROFILE || !sandbox.window.CUU_EVENTS) {
    throw new Error(`${STATIC_DATA} did not define window.CUU_PROFILE and window.CUU_EVENTS.`);
  }
  return { profile: sandbox.window.CUU_PROFILE, events: sandbox.window.CUU_EVENTS };
}

async function main() {
  loadEnv();
  const config = Config.fromEnv();
  const force = process.argv.includes("--force");

  if (force) {
    for (const file of ["events.json", "reviews.json", "profile.json"]) {
      await fs.rm(path.join(config.dataDir, file), { force: true });
    }
  }

  const container = Container.fromConfig(config);
  if ((await container.repositories.events.findAll()).length > 0) {
    console.log(`Data already exists in ${config.dataDir}. Run "npm run seed -- --force" to replace it.`);
    return;
  }

  const { profile, events } = await loadStaticData();
  const asset = (p: string) => (isRealUrl(p) ? p : `${config.publicUrl}/${p.replace(/^\/+/, "")}`);

  await container.repositories.profile.save(
    Profile.create({
      name: profile.name,
      handle: profile.handle ?? "",
      bio: profile.tagline ?? "",
      avatarText: profile.avatarText ?? "",
      heroImageUrl: profile.hero ? asset(profile.hero) : "",
      socials: (profile.socials ?? [])
        .filter((s) => isRealUrl(s.url))
        .map((s) => ({ platform: s.type as SocialLinkDTO["platform"], url: s.url })),
    }),
  );

  let skippedLinks = 0;
  for (const e of events) {
    const links = (e.links ?? []).filter((l) => {
      const ok = isRealUrl(l.url);
      if (!ok) skippedLinks += 1;
      return ok;
    });
    const input: CreateEventInput = {
      title: e.title,
      description: e.description,
      category: e.category,
      organizer: e.organizer,
      venue: e.venue,
      emoji: e.emoji,
      startsAt: e.start,
      endsAt: e.end,
      coverImage: e.image ? { url: asset(e.image), alt: `${e.title} poster` } : null,
      links: links.map((l) => ({ label: l.label, url: l.url, kind: kindFor(l.label), primary: l.primary === true })),
    };
    const created = await container.eventService.create(input);
    for (const review of SAMPLE_REVIEWS[e.id] ?? []) {
      if (created.acceptsReviews) await container.reviewService.add(created.id, review);
    }
  }

  console.log(`Seeded ${events.length} events into ${config.dataDir}.`);
  if (skippedLinks > 0) {
    console.log(`Skipped ${skippedLinks} placeholder links ("#"). Add real URLs in apps/static/events.js and re-seed.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
