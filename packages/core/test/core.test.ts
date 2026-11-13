import { beforeEach, describe, expect, it } from "vitest";
import {
  AnalyticsService,
  AuthService,
  BusinessRuleError,
  ConflictError,
  Event,
  EventService,
  FakeIdentityVerifier,
  FixedClock,
  ForbiddenError,
  ImageLink,
  InMemoryAnalyticsRepository,
  InMemoryEventRepository,
  InMemoryProfileRepository,
  InMemoryReviewRepository,
  InMemoryUserRepository,
  NotFoundError,
  PageRequiredError,
  ProfileService,
  Rating,
  ReviewService,
  SequentialIdGenerator,
  UnauthorizedError,
  Username,
  ValidationError,
  type CreateEventInput,
} from "../src";

const NOW = new Date("2026-11-12T12:00:00Z");

const upcoming: CreateEventInput = {
  title: "Opening Night",
  category: "Music",
  startsAt: "2026-11-21T17:00:00Z",
  endsAt: "2026-11-21T22:00:00Z",
  coverImage: { url: "https://example.com/poster.jpg", alt: "Poster" },
  links: [{ label: "Tickets", url: "https://example.com/tickets", kind: "tickets", primary: true }],
};

const past: CreateEventInput = {
  title: "Spring Showcase",
  category: "Theatre",
  startsAt: "2026-09-01T17:00:00Z",
  endsAt: "2026-09-01T21:00:00Z",
};

describe("Event entity", () => {
  const ctx = { id: "e1", ownerId: "u1", slug: "x", now: NOW };

  it("works out its status from the clock", () => {
    const event = Event.create(upcoming, ctx);
    expect(event.status(NOW)).toBe("upcoming");
    expect(event.status(new Date("2026-11-21T18:00:00Z"))).toBe("live");
    expect(event.status(new Date("2026-11-22T00:00:00Z"))).toBe("past");
  });

  it("rejects an end time before the start time", () => {
    expect(() => Event.create({ ...upcoming, endsAt: upcoming.startsAt }, ctx)).toThrow(ValidationError);
  });

  it("rejects image links that are not http(s)", () => {
    expect(() => Event.create({ ...upcoming, coverImage: { url: "javascript:alert(1)" } }, ctx)).toThrow(ValidationError);
  });

  it("refuses the same gallery image twice", () => {
    const event = Event.create(upcoming, ctx);
    event.addImage(ImageLink.create({ url: "https://example.com/a.jpg" }), NOW);
    expect(() => event.addImage(ImageLink.create({ url: "https://example.com/a.jpg" }), NOW)).toThrow(BusinessRuleError);
  });

  it("round-trips through its stored record, keeping owner and visibility", () => {
    const event = Event.create({ ...upcoming, hidden: true }, ctx);
    const again = Event.restore(event.toRecord());
    expect(again.toRecord()).toEqual(event.toRecord());
    expect(again.hidden).toBe(true);
    expect(again.isOwnedBy("u1")).toBe(true);
  });
});

describe("Value objects", () => {
  it("Rating only accepts whole stars from 1 to 5", () => {
    expect(Rating.of(5).stars).toBe(5);
    for (const bad of [0, 6, 2.5, "x"]) expect(() => Rating.of(bad)).toThrow(ValidationError);
  });

  it("Username lower-cases, strips @ and rejects reserved or malformed names", () => {
    expect(Username.of("@JazzFest").value).toBe("jazzfest");
    for (const bad of ["ab", "admin", "has space", "-dash", "x".repeat(31)]) expect(() => Username.of(bad)).toThrow(ValidationError);
  });
});

describe("Platform services", () => {
  let auth: AuthService;
  let events: EventService;
  let reviews: ReviewService;
  let profiles: ProfileService;
  let analytics: AnalyticsService;
  let clock: FixedClock;

  beforeEach(() => {
    const eventRepo = new InMemoryEventRepository();
    const reviewRepo = new InMemoryReviewRepository();
    const profileRepo = new InMemoryProfileRepository();
    const ids = new SequentialIdGenerator();
    clock = new FixedClock(NOW);
    auth = new AuthService(new InMemoryUserRepository(), profileRepo, new FakeIdentityVerifier(), clock);
    events = new EventService(eventRepo, reviewRepo, profileRepo, clock, ids);
    reviews = new ReviewService(eventRepo, reviewRepo, clock, ids);
    profiles = new ProfileService(profileRepo);
    analytics = new AnalyticsService(new InMemoryAnalyticsRepository(), profileRepo, eventRepo, clock, ids);
  });

  /** Signs in with a fake Neon Auth token and claims a username, as the apps do after Neon sign-up. */
  const signup = async (username: string) => {
    const token = FakeIdentityVerifier.tokenFor(`neon-${username}`, `${username}@example.com`);
    return { token, user: await auth.claim(token, { username }) };
  };

  describe("AuthService", () => {
    it("claims a username for a Neon identity and creates the page", async () => {
      const token = FakeIdentityVerifier.tokenFor("neon-1", "Host@Example.com", "City Jazz");
      expect(await auth.me(token)).toEqual({ identity: { id: "neon-1", email: "Host@Example.com" }, user: null });
      await expect(auth.authenticate(token)).rejects.toThrow(PageRequiredError);

      const user = await auth.claim(token, { username: "jazzfest" });
      expect(user).toMatchObject({ id: "neon-1", email: "host@example.com", username: "jazzfest" });
      expect((await events.tree("jazzfest")).profile.displayName).toBe("City Jazz");
      expect((await auth.authenticate(token)).id).toBe("neon-1");
      expect((await auth.me(token)).user?.username).toBe("jazzfest");
    });

    it("refuses taken usernames, a second page and bad tokens", async () => {
      await signup("jazzfest");
      await expect(signup("jazzfest")).rejects.toThrow(ConflictError);
      const other = FakeIdentityVerifier.tokenFor("neon-2", "other@example.com");
      await expect(auth.claim(other, { username: "jazzfest" })).rejects.toThrow(ConflictError);
      await auth.claim(other, { username: "runclub" });
      await expect(auth.claim(other, { username: "another" })).rejects.toThrow(ConflictError);
      const third = FakeIdentityVerifier.tokenFor("neon-3", "third@example.com");
      await expect(auth.claim(third, { username: "a" })).rejects.toThrow(ValidationError);
      await expect(auth.claim(third, { username: "admin" })).rejects.toThrow(ValidationError);
      await expect(auth.authenticate("garbage")).rejects.toThrow(UnauthorizedError);
      await expect(auth.me(null)).rejects.toThrow(UnauthorizedError);
    });

    it("reports username availability", async () => {
      await signup("jazzfest");
      expect((await auth.isUsernameAvailable("JazzFest")).available).toBe(false);
      expect((await auth.isUsernameAvailable("runclub")).available).toBe(true);
      expect((await auth.isUsernameAvailable("admin")).available).toBe(false);
    });
  });

  describe("EventService", () => {
    it("splits a public page into upcoming and past, hiding hidden events", async () => {
      const { user } = await signup("jazzfest");
      await events.create(user.id, upcoming);
      await events.create(user.id, past);
      await events.create(user.id, { ...upcoming, title: "Secret Set", hidden: true });

      const tree = await events.tree("jazzfest");
      expect(tree.upcoming.map((e) => e.title)).toEqual(["Opening Night"]);
      expect(tree.past.map((e) => e.title)).toEqual(["Spring Showcase"]);
      expect(tree.categories).toEqual(["Music", "Theatre"]);
      expect(await events.listMine(user.id)).toHaveLength(3);
      await expect(events.getPublic("jazzfest", "secret-set")).rejects.toThrow(NotFoundError);
    });

    it("keeps slugs unique per host, not globally", async () => {
      const a = (await signup("jazzfest")).user;
      const b = (await signup("runclub")).user;
      expect((await events.create(a.id, upcoming)).slug).toBe("opening-night");
      expect((await events.create(a.id, upcoming)).slug).toBe("opening-night-2");
      expect((await events.create(b.id, upcoming)).slug).toBe("opening-night");
    });

    it("stops hosts from editing each other's events", async () => {
      const a = (await signup("jazzfest")).user;
      const b = (await signup("runclub")).user;
      const event = await events.create(a.id, upcoming);
      await expect(events.update(b.id, event.id, { title: "Hijacked" })).rejects.toThrow(ForbiddenError);
      await expect(events.remove(b.id, event.id)).rejects.toThrow(ForbiddenError);
      expect((await events.update(a.id, event.id, { hidden: true })).hidden).toBe(true);
    });

    it("puts new events on top and saves a manual order", async () => {
      const { user } = await signup("jazzfest");
      const first = await events.create(user.id, past);
      const second = await events.create(user.id, upcoming);
      expect((await events.listMine(user.id)).map((e) => e.id)).toEqual([second.id, first.id]);
      expect((await events.reorder(user.id, [first.id, second.id])).map((e) => e.id)).toEqual([first.id, second.id]);
      await expect(events.reorder(user.id, [first.id])).rejects.toThrow(ValidationError);
    });
  });

  describe("ReviewService", () => {
    it("only takes reviews once an event has started, and summarises them", async () => {
      const { user } = await signup("jazzfest");
      const future = await events.create(user.id, upcoming);
      const done = await events.create(user.id, past);
      await expect(reviews.add(future.id, { authorName: "Amina", rating: 5 })).rejects.toThrow(BusinessRuleError);
      await reviews.add(done.id, { authorName: "Amina", rating: 5, comment: "Loved it" });
      await reviews.add(done.id, { authorName: "Brian", rating: 4 });
      expect(await reviews.summary(done.id)).toEqual({ count: 2, average: 4.5, distribution: [0, 0, 0, 1, 1] });
    });
  });

  describe("ProfileService", () => {
    it("applies a theme preset, then marks the theme custom when a colour changes", async () => {
      const { user } = await signup("jazzfest");
      const poster = await profiles.updateMine(user.id, { displayName: "City Jazz", appearance: { themeId: "gig-poster" } });
      expect(poster.appearance).toMatchObject({ themeId: "gig-poster", buttonStyle: "shadow" });
      const custom = await profiles.updateMine(user.id, { appearance: { colors: { background: "#000000" } } });
      expect(custom.appearance.themeId).toBe("custom");
      expect(custom.appearance.colors.background).toBe("#000000");
      await expect(profiles.updateMine(user.id, { appearance: { colors: { text: "red" } } })).rejects.toThrow(ValidationError);
    });
  });

  describe("AnalyticsService", () => {
    it("counts views and clicks per day and ranks events by clicks", async () => {
      const { user } = await signup("jazzfest");
      const event = await events.create(user.id, upcoming);
      await analytics.recordView("jazzfest");
      await analytics.recordView("jazzfest");
      await analytics.recordClick(event.id);
      clock.set(new Date("2026-11-13T09:00:00Z"));
      await analytics.recordView("jazzfest");

      const summary = await analytics.summary(user.id, 7);
      expect(summary).toMatchObject({ days: 7, views: 3, clicks: 1, clickRate: 0.333 });
      expect(summary.series.at(-2)).toEqual({ date: "2026-11-12", views: 2, clicks: 1 });
      expect(summary.series.at(-1)).toEqual({ date: "2026-11-13", views: 1, clicks: 0 });
      expect(summary.topEvents).toEqual([{ eventId: event.id, title: "Opening Night", clicks: 1 }]);
    });
  });
});
