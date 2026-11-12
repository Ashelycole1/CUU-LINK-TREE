import path from "node:path";
import {
  Event,
  Profile,
  Review,
  type EventRecord,
  type EventRepository,
  type ProfileDTO,
  type ProfileRepository,
  type ReviewRecord,
  type ReviewRepository,
} from "@event-tree/core";
import { JsonFileStore } from "./JsonFileStore";

/**
 * File-backed implementations of the core repository interfaces.
 * Each one maps between entities and the plain records on disk; none of
 * them contain business rules.
 */
export class JsonEventRepository implements EventRepository {
  private readonly store: JsonFileStore<EventRecord[]>;

  constructor(dataDir: string) {
    this.store = new JsonFileStore(path.join(dataDir, "events.json"), () => []);
  }

  async findAll(): Promise<Event[]> {
    return (await this.store.read()).map((r) => Event.restore(r));
  }

  async findById(id: string): Promise<Event | null> {
    const record = (await this.store.read()).find((r) => r.id === id);
    return record ? Event.restore(record) : null;
  }

  async findBySlug(slug: string): Promise<Event | null> {
    const record = (await this.store.read()).find((r) => r.slug === slug);
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
  private readonly store: JsonFileStore<ProfileDTO | null>;

  constructor(dataDir: string) {
    this.store = new JsonFileStore(path.join(dataDir, "profile.json"), () => null);
  }

  async get(): Promise<Profile> {
    const data = await this.store.read();
    return Profile.create(data ?? { name: "Event Tree", bio: "Run `npm run seed` to load sample data." });
  }

  save(profile: Profile): Promise<void> {
    return this.store.update(() => profile.toDTO());
  }
}
