import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  FixedClock,
  InMemoryEventRepository,
  InMemoryProfileRepository,
  InMemoryReviewRepository,
  Profile,
  SequentialIdGenerator,
} from "@event-tree/core";
import { Container } from "../src/container";
import { API_PREFIX, createApp } from "../src/http/createApp";

const ADMIN_KEY = "test-key";
const read = (res: Response): Promise<any> => res.json();
let server: Server;
let base: string;

beforeAll(async () => {
  const container = new Container(
    {
      events: new InMemoryEventRepository(),
      reviews: new InMemoryReviewRepository(),
      profile: new InMemoryProfileRepository(Profile.create({ name: "Test Tree" })),
    },
    new FixedClock(new Date("2026-11-12T12:00:00Z")),
    new SequentialIdGenerator("t"),
  );
  const app = createApp(container, { adminKey: ADMIN_KEY, corsOrigins: "*", staticAssetsDir: "." });
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}${API_PREFIX}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const json = (body: unknown, admin = true) => ({
  method: "POST",
  headers: { "content-type": "application/json", ...(admin ? { "x-admin-key": ADMIN_KEY } : {}) },
  body: JSON.stringify(body),
});

const pastEvent = {
  title: "Cloud Study Jam",
  category: "Tech",
  startsAt: "2026-10-10T11:00:00Z",
  endsAt: "2026-10-10T14:00:00Z",
  coverImage: { url: "https://example.com/jam.jpg" },
};

describe("Event Tree API", () => {
  it("serves the profile", async () => {
    const res = await fetch(`${base}/profile`);
    expect(res.status).toBe(200);
    expect((await read(res)).name).toBe("Test Tree");
  });

  it("requires the admin key to post events", async () => {
    const res = await fetch(`${base}/events`, json(pastEvent, false));
    expect(res.status).toBe(401);
  });

  it("posts an event, lists it under past, and fetches it by slug", async () => {
    const created = await fetch(`${base}/events`, json(pastEvent));
    expect(created.status).toBe(201);
    expect(created.headers.get("location")).toBe("/api/v1/events/cloud-study-jam");

    const past = await read(await fetch(`${base}/events?when=past`));
    expect(past.map((e: { slug: string }) => e.slug)).toContain("cloud-study-jam");
    expect((await read(await fetch(`${base}/events?when=upcoming`)))).toHaveLength(0);

    const one = await read(await fetch(`${base}/events/cloud-study-jam`));
    expect(one.status).toBe("past");
  });

  it("returns field errors as 400 with the field name", async () => {
    const res = await fetch(`${base}/events`, json({ ...pastEvent, coverImage: { url: "not a link" } }));
    expect(res.status).toBe(400);
    expect((await read(res)).error.field).toBe("Image link");
  });

  it("takes reviews and gallery images without the admin key", async () => {
    const review = await fetch(`${base}/events/cloud-study-jam/reviews`, json({ authorName: "Amina", rating: 4 }, false));
    expect(review.status).toBe(201);

    const summary = await read(await fetch(`${base}/events/cloud-study-jam/reviews/summary`));
    expect(summary).toMatchObject({ count: 1, average: 4 });

    const image = await fetch(`${base}/events/cloud-study-jam/images`, json({ url: "https://example.com/1.jpg" }, false));
    expect(image.status).toBe(201);
    expect((await read(image)).gallery).toHaveLength(1);
  });

  it("refuses reviews for events that have not started (409)", async () => {
    await fetch(`${base}/events`, json({ ...pastEvent, title: "Hackathon", startsAt: "2026-12-05T05:00:00Z", endsAt: "2026-12-07T05:00:00Z" }));
    const res = await fetch(`${base}/events/hackathon/reviews`, json({ authorName: "Amina", rating: 5 }, false));
    expect(res.status).toBe(409);
  });

  it("404s on unknown events and routes", async () => {
    expect((await fetch(`${base}/events/nope`)).status).toBe(404);
    expect((await fetch(`${base}/nothing-here`)).status).toBe(404);
  });
});
