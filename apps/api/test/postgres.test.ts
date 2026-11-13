import { beforeAll, describe, expect, it } from "vitest";
import { newDb } from "pg-mem";
import type { Pool } from "pg";
import { FixedClock, SequentialIdGenerator } from "@event-tree/core";
import { Container } from "../src/container";
import { HmacTokenService, ScryptPasswordHasher } from "../src/infrastructure/crypto";
import { migrate } from "../src/infrastructure/PostgresRepositories";

/**
 * The Postgres repositories, driven through the real services against
 * pg-mem (an in-process Postgres), so the SQL runs without a server.
 */
let c: Container;
const clock = new FixedClock(new Date("2026-11-12T12:00:00Z"));

beforeAll(async () => {
  const { Pool: MemPool } = newDb().adapters.createPg();
  const pool = new MemPool() as Pool;
  await migrate(pool);
  c = new Container(
    Container.pgRepositories(pool),
    { hasher: new ScryptPasswordHasher(), tokens: new HmacTokenService("test-secret-at-least-16") },
    clock,
    new SequentialIdGenerator("pg"),
  );
});

describe("Postgres storage", () => {
  let ownerId = "";

  it("signs up, logs in and enforces unique usernames and emails", async () => {
    const { user } = await c.auth.signup({ email: "host@example.com", username: "jazzfest", password: "long-password-1", displayName: "Jazz Fest" });
    ownerId = user.id;
    const login = await c.auth.login({ email: "host@example.com", password: "long-password-1" });
    expect(login.user.username).toBe("jazzfest");
    await expect(
      c.auth.signup({ email: "other@example.com", username: "jazzfest", password: "long-password-1", displayName: "x" }),
    ).rejects.toThrow();
    await expect(
      c.auth.signup({ email: "host@example.com", username: "another", password: "long-password-1", displayName: "x" }),
    ).rejects.toThrow();
  });

  it("stores profiles and serves the public page", async () => {
    await c.profiles.updateMine(ownerId, { bio: "Every show in one place." });
    const event = await c.events.create(ownerId, {
      title: "Opening Night",
      category: "Music",
      startsAt: "2026-12-05T17:00:00Z",
      endsAt: "2026-12-05T21:00:00Z",
    });
    await c.events.create(ownerId, {
      title: "Spring Showcase",
      category: "Theatre",
      startsAt: "2026-10-10T17:00:00Z",
      endsAt: "2026-10-10T20:00:00Z",
    });

    const page = await c.events.tree("jazzfest");
    expect(page.profile.bio).toBe("Every show in one place.");
    expect(page.upcoming.map((e) => e.title)).toEqual(["Opening Night"]);
    expect(page.past.map((e) => e.title)).toEqual(["Spring Showcase"]);

    await c.events.update(ownerId, event.id, { title: "Opening Night (moved)" });
    expect((await c.events.tree("jazzfest")).upcoming[0]!.title).toBe("Opening Night (moved)");
  });

  it("keeps reviews and analytics per owner", async () => {
    const past = (await c.events.tree("jazzfest")).past[0]!;
    await c.reviews.add(past.id, { authorName: "Ann", rating: 5, comment: "Brilliant." });
    expect((await c.reviews.list(past.id)).length).toBe(1);

    await c.analytics.recordView("jazzfest");
    await c.analytics.recordClick(past.id);
    const summary = await c.analytics.summary(ownerId, 7);
    expect(summary).toMatchObject({ views: 1, clicks: 1 });
  });

  it("deletes an event with its reviews", async () => {
    const past = (await c.events.tree("jazzfest")).past[0]!;
    await c.events.remove(ownerId, past.id);
    expect((await c.events.tree("jazzfest")).past).toEqual([]);
    expect(await c.repositories.reviews.findByEvent(past.id)).toEqual([]);
  });
});
