import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  FakeIdentityVerifier,
  FixedClock,
  InMemoryAnalyticsRepository,
  InMemoryEventRepository,
  InMemoryProfileRepository,
  InMemoryReviewRepository,
  InMemoryUserRepository,
  SequentialIdGenerator,
} from "@event-tree/core";
import { Container } from "../src/container";
import { API_PREFIX, createApp } from "../src/http/createApp";
import { MemoryMediaStore } from "../src/infrastructure/media";

let server: Server;
let base: string;
let origin: string;
const media = new MemoryMediaStore();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const read = (res: Response): Promise<any> => res.json();

beforeAll(async () => {
  const container = new Container(
    {
      users: new InMemoryUserRepository(),
      profiles: new InMemoryProfileRepository(),
      events: new InMemoryEventRepository(),
      reviews: new InMemoryReviewRepository(),
      analytics: new InMemoryAnalyticsRepository(),
    },
    new FakeIdentityVerifier(),
    media,
    new FixedClock(new Date("2026-11-12T12:00:00Z")),
    new SequentialIdGenerator("t"),
  );
  server = createApp(container, { corsOrigins: "*", staticAssetsDir: ".", publicUrl: "https://tree.example" }).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  base = `${origin}${API_PREFIX}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

/** A tiny valid PNG header: enough for the upload's image check. */
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);

function upload(path: string, bytes: Uint8Array, token?: string) {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "image/png", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: bytes,
  });
}

function call(method: string, path: string, body?: unknown, token?: string) {
  return fetch(`${base}${path}`, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const pastEvent = {
  title: "Spring Showcase",
  category: "Theatre",
  startsAt: "2026-10-10T17:00:00Z",
  endsAt: "2026-10-10T20:00:00Z",
  coverImage: { url: "https://example.com/show.jpg" },
};
const futureEvent = { ...pastEvent, title: "Opening Night", startsAt: "2026-12-05T17:00:00Z", endsAt: "2026-12-05T21:00:00Z" };

describe("Event Tree API", () => {
  const token = FakeIdentityVerifier.tokenFor("neon-user-1", "host@example.com", "City Jazz");
  const otherToken = FakeIdentityVerifier.tokenFor("neon-user-2", "b@example.com");
  let pastId = "";

  it("needs a page claimed before the dashboard, then reads the session", async () => {
    expect((await read(await call("GET", "/auth/me", undefined, token))).user).toBeNull();
    expect((await call("GET", "/me/events", undefined, token)).status).toBe(403);

    expect((await read(await call("GET", "/auth/username/jazzfest"))).available).toBe(true);
    const res = await call("POST", "/auth/claim", { username: "jazzfest" }, token);
    expect(res.status).toBe(201);
    expect((await read(res)).username).toBe("jazzfest");
    const me = await read(await call("GET", "/auth/me", undefined, token));
    expect(me).toMatchObject({ identity: { id: "neon-user-1", email: "host@example.com" }, user: { username: "jazzfest" } });
    expect((await read(await call("GET", "/auth/username/jazzfest"))).available).toBe(false);

    expect((await call("POST", "/auth/claim", { username: "runclub" }, otherToken)).status).toBe(201);
  });

  it("returns 409 for a taken username or a second claim, and 401 without a valid token", async () => {
    const third = FakeIdentityVerifier.tokenFor("neon-user-3", "c@example.com");
    expect((await call("POST", "/auth/claim", { username: "jazzfest" }, third)).status).toBe(409);
    expect((await call("POST", "/auth/claim", { username: "another" }, token)).status).toBe(409);
    expect((await call("GET", "/auth/me")).status).toBe(401);
    expect((await call("GET", "/me/events")).status).toBe(401);
    expect((await call("GET", "/me/events", undefined, "forged.token")).status).toBe(401);
  });

  it("lets a host post events and shows them on the public page", async () => {
    const created = await call("POST", "/me/events", pastEvent, token);
    expect(created.status).toBe(201);
    pastId = (await read(created)).id;
    await call("POST", "/me/events", futureEvent, token);
    await call("POST", "/me/events", { ...futureEvent, title: "Secret Set", hidden: true }, token);

    const tree = await read(await call("GET", "/pages/jazzfest"));
    expect(tree.profile.displayName).toBe("City Jazz");
    expect(tree.upcoming.map((e: { title: string }) => e.title)).toEqual(["Opening Night"]);
    expect(tree.past.map((e: { title: string }) => e.title)).toEqual(["Spring Showcase"]);
    expect((await call("GET", "/pages/jazzfest/events/opening-night")).status).toBe(200);
    expect((await call("GET", "/pages/jazzfest/events/secret-set")).status).toBe(404);
    expect(await read(await call("GET", "/me/events", undefined, token))).toHaveLength(3);
  });

  it("returns 403 when a host edits someone else's event", async () => {
    expect((await call("PATCH", `/me/events/${pastId}`, { title: "Mine now" }, otherToken)).status).toBe(403);
    expect((await call("DELETE", `/me/events/${pastId}`, undefined, otherToken)).status).toBe(403);
  });

  it("returns field errors as 400", async () => {
    const res = await call("POST", "/me/events", { ...pastEvent, coverImage: { url: "not a link" } }, token);
    expect(res.status).toBe(400);
    expect((await read(res)).error.field).toBe("Image link");
  });

  it("takes reviews and photos from visitors, and refuses early reviews", async () => {
    expect((await call("POST", `/events/${pastId}/reviews`, { authorName: "Amina", rating: 4 })).status).toBe(201);
    expect(await read(await call("GET", `/events/${pastId}/reviews/summary`))).toMatchObject({ count: 1, average: 4 });
    const image = await call("POST", `/events/${pastId}/images`, { url: "https://example.com/1.jpg" });
    expect((await read(image)).gallery).toHaveLength(1);

    const future = (await read(await call("GET", "/pages/jazzfest"))).upcoming[0];
    expect((await call("POST", `/events/${future.id}/reviews`, { authorName: "A", rating: 5 })).status).toBe(409);
  });

  it("updates appearance and reorders events", async () => {
    const profile = await read(await call("PATCH", "/me/profile", { bio: "Live jazz every month", appearance: { themeId: "gig-poster" } }, token));
    expect(profile.appearance.themeId).toBe("gig-poster");
    expect(await read(await call("GET", "/themes"))).toHaveLength(6);

    const mine = await read(await call("GET", "/me/events", undefined, token));
    const reversed = mine.map((e: { id: string }) => e.id).reverse();
    const reordered = await read(await call("PUT", "/me/events/order", { ids: reversed }, token));
    expect(reordered.map((e: { id: string }) => e.id)).toEqual(reversed);
  });

  it("counts page views and clicks for the host's analytics", async () => {
    expect((await call("POST", "/pages/jazzfest/views")).status).toBe(204);
    await call("POST", "/pages/jazzfest/views");
    expect((await call("POST", `/events/${pastId}/clicks`)).status).toBe(204);
    const stats = await read(await call("GET", "/me/analytics?days=7", undefined, token));
    expect(stats).toMatchObject({ days: 7, views: 2, clicks: 1, clickRate: 0.5 });
    expect(stats.topEvents[0]).toMatchObject({ eventId: pastId, clicks: 1 });
  });

  it("stores uploaded images and serves them from /media", async () => {
    expect((await upload("/me/uploads", PNG)).status).toBe(401);
    expect((await upload("/me/uploads", new TextEncoder().encode("<svg onload=alert(1)>"), token)).status).toBe(400);

    const res = await upload("/me/uploads", PNG, token);
    expect(res.status).toBe(201);
    const { url } = await read(res);
    expect(url).toMatch(/^https:\/\/tree\.example\/media\/u\/neon-user-1\/[\w-]+\.png$/);

    const served = await fetch(`${origin}${new URL(url).pathname}`);
    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/png");
    expect(served.headers.get("cache-control")).toContain("immutable");
    expect(new Uint8Array(await served.arrayBuffer())).toEqual(PNG);
    expect((await fetch(`${origin}/media/u/nobody/missing.png`)).status).toBe(404);
    expect((await fetch(`${origin}/media/..%2F..%2Fsecret`)).status).toBe(404);
  });

  it("adds a visitor's photo to an event and drops the file for unknown events", async () => {
    const res = await upload(`/events/${pastId}/photos?caption=${encodeURIComponent("Front row")}`, PNG);
    expect(res.status).toBe(201);
    const event = await read(res);
    expect(event.gallery.at(-1)).toMatchObject({ caption: "Front row" });
    expect(event.gallery.at(-1).url).toContain("/media/e/");

    const before = media.objects.size;
    expect((await upload("/events/no-such-event/photos", PNG)).status).toBe(404);
    expect(media.objects.size).toBe(before);
  });

  it("404s on unknown pages and routes", async () => {
    expect((await call("GET", "/pages/nobody-here")).status).toBe(404);
    expect((await call("GET", "/nothing")).status).toBe(404);
  });
});
