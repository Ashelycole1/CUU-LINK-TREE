import { Event } from "../events/Event";
import type { EventRepository } from "../events/EventRepository";
import { Profile, type ProfileRepository } from "../profile/Profile";
import { Review } from "../reviews/Review";
import type { ReviewRepository } from "../reviews/ReviewRepository";

/**
 * In-memory adapters. Used by tests and previews, and as the base the API's
 * JSON file stores extend. They store records, not instances, so callers
 * can never mutate stored state without calling save().
 */
export class InMemoryEventRepository implements EventRepository {
  protected readonly records = new Map<string, ReturnType<Event["toRecord"]>>();

  async findAll(): Promise<Event[]> {
    return [...this.records.values()].map((r) => Event.restore(r));
  }

  async findById(id: string): Promise<Event | null> {
    const record = this.records.get(id);
    return record ? Event.restore(record) : null;
  }

  async findBySlug(slug: string): Promise<Event | null> {
    for (const record of this.records.values()) if (record.slug === slug) return Event.restore(record);
    return null;
  }

  async save(event: Event): Promise<void> {
    this.records.set(event.id, event.toRecord());
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }
}

export class InMemoryReviewRepository implements ReviewRepository {
  protected readonly records = new Map<string, ReturnType<Review["toRecord"]>>();

  async findByEvent(eventId: string): Promise<Review[]> {
    return [...this.records.values()].filter((r) => r.eventId === eventId).map((r) => Review.restore(r));
  }

  async save(review: Review): Promise<void> {
    this.records.set(review.id, review.toRecord());
  }

  async deleteByEvent(eventId: string): Promise<void> {
    for (const [id, record] of this.records) if (record.eventId === eventId) this.records.delete(id);
  }
}

export class InMemoryProfileRepository implements ProfileRepository {
  constructor(private profile: Profile) {}

  async get(): Promise<Profile> {
    return this.profile;
  }

  async save(profile: Profile): Promise<void> {
    this.profile = profile;
  }
}
