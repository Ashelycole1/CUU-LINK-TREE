import path from "node:path";
import {
  Event,
  Profile,
  Review,
  User,
  type AnalyticsRecord,
  type AnalyticsRepository,
  type EventRecord,
  type EventRepository,
  type ProfileDTO,
  type ProfileRepository,
  type ReviewRecord,
  type ReviewRepository,
  type UserRecord,
  type UserRepository,
} from "@event-tree/core";
import { JsonFileStore } from "./JsonFileStore";

/**
 * File-backed implementations of the core repository interfaces.
 * Each maps between entities and plain records on disk; none contain business rules.
 */
export class JsonEventRepository implements EventRepository {
  private readonly store: JsonFileStore<EventRecord[]>;

  constructor(dataDir: string) {
    this.store = new JsonFileStore(path.join(dataDir, "events.json"), () => []);
  }

  async findById(id: string): Promise<Event | null> {
    const record = (await this.store.read()).find((r) => r.id === id);
    return record ? Event.restore(record) : null;
  }

  async findByOwner(ownerId: string): Promise<Event[]> {
    return (await this.store.read()).filter((r) => r.ownerId === ownerId).map((r) => Event.restore(r));
  }

  async findBySlug(ownerId: string, slug: string): Promise<Event | null> {
    const record = (await this.store.read()).find((r) => r.ownerId === ownerId && r.slug === slug);
    return record ? Event.restore(record) : null;
  }

  save(event: Event): Promise<void> {
    const record = event.toRecord();
    return this.store.update((all) => [...all.filter((r) => r.id !== record.id), record]);
  }

  delete(id: string): Promise<void> {
    return this.store.update((all) => all.filter((r) => r.id !== id));
  }
}

export class JsonReviewRepository implements ReviewRepository {
  private readonly store: JsonFileStore<ReviewRecord[]>;

  constructor(dataDir: string) {
    this.store = new JsonFileStore(path.join(dataDir, "reviews.json"), () => []);
  }

  async findByEvent(eventId: string): Promise<Review[]> {
    return (await this.store.read()).filter((r) => r.eventId === eventId).map((r) => Review.restore(r));
  }

  save(review: Review): Promise<void> {
    const record = review.toRecord();
    return this.store.update((all) => [...all.filter((r) => r.id !== record.id), record]);
  }

  deleteByEvent(eventId: string): Promise<void> {
    return this.store.update((all) => all.filter((r) => r.eventId !== eventId));
  }
}

export class JsonProfileRepository implements ProfileRepository {
  private readonly store: JsonFileStore<ProfileDTO[]>;

  constructor(dataDir: string) {
    this.store = new JsonFileStore(path.join(dataDir, "profiles.json"), () => []);
  }

  async findByOwner(ownerId: string): Promise<Profile | null> {
    const data = (await this.store.read()).find((p) => p.ownerId === ownerId);
    return data ? Profile.restore(data) : null;
  }

  async findByUsername(username: string): Promise<Profile | null> {
    const data = (await this.store.read()).find((p) => p.username === username);
    return data ? Profile.restore(data) : null;
  }

  save(profile: Profile): Promise<void> {
    const data = profile.toDTO();
    return this.store.update((all) => [...all.filter((p) => p.ownerId !== data.ownerId), data]);
  }
}

export class JsonUserRepository implements UserRepository {
  private readonly store: JsonFileStore<UserRecord[]>;

  constructor(dataDir: string) {
    this.store = new JsonFileStore(path.join(dataDir, "users.json"), () => []);
  }

  private async find(match: (r: UserRecord) => boolean): Promise<User | null> {
    const record = (await this.store.read()).find(match);
    return record ? User.restore(record) : null;
  }

  findById(id: string) {
    return this.find((r) => r.id === id);
  }

  findByEmail(email: string) {
    return this.find((r) => r.email === email);
  }

  findByUsername(username: string) {
    return this.find((r) => r.username === username);
  }

  save(user: User): Promise<void> {
    const record = user.toRecord();
    return this.store.update((all) => [...all.filter((r) => r.id !== record.id), record]);
  }
}

export class JsonAnalyticsRepository implements AnalyticsRepository {
  private readonly store: JsonFileStore<AnalyticsRecord[]>;

  constructor(dataDir: string) {
    this.store = new JsonFileStore(path.join(dataDir, "analytics.json"), () => []);
  }

  add(record: AnalyticsRecord): Promise<void> {
    return this.store.update((all) => [...all, record]);
  }

  async findByOwner(ownerId: string, since: Date): Promise<AnalyticsRecord[]> {
    const t = since.getTime();
    return (await this.store.read()).filter((r) => r.ownerId === ownerId && new Date(r.at).getTime() >= t);
  }
}
