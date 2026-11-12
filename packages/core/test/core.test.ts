import { beforeEach, describe, expect, it } from "vitest";
import {
  BusinessRuleError,
  Event,
  EventService,
  FixedClock,
  ImageLink,
  InMemoryEventRepository,
  InMemoryReviewRepository,
  NotFoundError,
  Rating,
  ReviewService,
  SequentialIdGenerator,
  ValidationError,
  type CreateEventInput,
} from "../src";

const NOW = new Date("2026-11-12T12:00:00Z");

const upcoming: CreateEventInput = {
  title: "DevFest on Campus",
  category: "Tech",
  startsAt: "2026-11-21T07:00:00Z",
  endsAt: "2026-11-21T13:00:00Z",
  coverImage: { url: "https://example.com/devfest.jpg", alt: "DevFest poster" },
  links: [{ label: "Register", url: "https://example.com/register", kind: "register", primary: true }],
};

const past: CreateEventInput = {
  title: "Orientation Week",
  category: "Campus",
  startsAt: "2026-09-01T07:00:00Z",
  endsAt: "2026-09-05T15:00:00Z",
};

describe("Event entity", () => {
  const ctx = { id: "e1", slug: "x", now: NOW };

  it("works out its status from the clock", () => {
    const event = Event.create(upcoming, ctx);
    expect(event.status(NOW)).toBe("upcoming");
    expect(event.status(new Date("2026-11-21T09:00:00Z"))).toBe("live");
    expect(event.status(new Date("2026-11-22T00:00:00Z"))).toBe("past");
  });

  it("rejects an end time before the start time", () => {
    expect(() => Event.create({ ...upcoming, endsAt: upcoming.startsAt }, ctx)).toThrow(ValidationError);
  });

  it("rejects image links that are not http(s)", () => {
    expect(() => Event.create({ ...upcoming, coverImage: { url: "javascript:alert(1)" } }, ctx)).toThrow(
      ValidationError,
    );
  });

  it("refuses the same gallery image twice", () => {
    const event = Event.create(upcoming, ctx);
    event.addImage(ImageLink.create({ url: "https://example.com/a.jpg" }), NOW);
    expect(() => event.addImage(ImageLink.create({ url: "https://example.com/a.jpg" }), NOW)).toThrow(
      BusinessRuleError,
    );
  });

  it("round-trips through its stored record", () => {
    const event = Event.create(upcoming, ctx);
    expect(Event.restore(event.toRecord()).toRecord()).toEqual(event.toRecord());
  });
});

describe("Rating", () => {
  it("only accepts whole stars from 1 to 5", () => {
    expect(Rating.of(5).stars).toBe(5);
    for (const bad of [0, 6, 2.5, "x"]) expect(() => Rating.of(bad)).toThrow(ValidationError);
  });
});

describe("EventService and ReviewService", () => {
  let events: EventService;
  let reviews: ReviewService;

  beforeEach(() => {
    const eventRepo = new InMemoryEventRepository();
    const reviewRepo = new InMemoryReviewRepository();
    const clock = new FixedClock(NOW);
    const ids = new SequentialIdGenerator();
    events = new EventService(eventRepo, reviewRepo, clock, ids);
    reviews = new ReviewService(eventRepo, reviewRepo, clock, ids);
  });

  it("splits events into upcoming and past", async () => {
    await events.create(upcoming);
    await events.create(past);
    expect((await events.list({ when: "upcoming" })).map((e) => e.title)).toEqual(["DevFest on Campus"]);
    expect((await events.list({ when: "past" })).map((e) => e.title)).toEqual(["Orientation Week"]);
  });

  it("gives clashing titles unique slugs and finds events by slug", async () => {
    const a = await events.create(upcoming);
    const b = await events.create(upcoming);
    expect([a.slug, b.slug]).toEqual(["devfest-on-campus", "devfest-on-campus-2"]);
    expect((await events.get("devfest-on-campus-2")).id).toBe(b.id);
  });

  it("filters by category and search text", async () => {
    await events.create(upcoming);
    await events.create(past);
    expect(await events.list({ category: "campus" })).toHaveLength(1);
    expect(await events.list({ q: "devfest" })).toHaveLength(1);
    expect(await events.categories()).toEqual(["Campus", "Tech"]);
  });

  it("only takes reviews once an event has started, and summarises them", async () => {
    const future = await events.create(upcoming);
    const done = await events.create(past);

    await expect(reviews.add(future.id, { authorName: "Amina", rating: 5 })).rejects.toThrow(BusinessRuleError);

    await reviews.add(done.slug, { authorName: "Amina", rating: 5, comment: "Loved it" });
    await reviews.add(done.slug, { authorName: "Brian", rating: 4 });

    const summary = await reviews.summary(done.id);
    expect(summary).toEqual({ count: 2, average: 4.5, distribution: [0, 0, 0, 1, 1] });
    expect((await events.get(done.id)).rating.average).toBe(4.5);
  });

  it("deletes an event's reviews with it", async () => {
    const done = await events.create(past);
    await reviews.add(done.id, { authorName: "Amina", rating: 3 });
    await events.remove(done.id);
    await expect(reviews.list(done.id)).rejects.toThrow(NotFoundError);
  });

  it("adds gallery images by link", async () => {
    const done = await events.create(past);
    const updated = await events.addImage(done.id, { url: "https://example.com/photo.jpg", caption: "Day 1" });
    expect(updated.gallery).toEqual([{ url: "https://example.com/photo.jpg", alt: "", caption: "Day 1" }]);
  });
});
