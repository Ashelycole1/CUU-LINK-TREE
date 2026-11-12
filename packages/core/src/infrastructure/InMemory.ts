import type { AnalyticsRecord } from "../dto";
import type { AnalyticsRepository } from "../analytics/AnalyticsService";
import { Event } from "../events/Event";
import type { EventRepository } from "../events/EventRepository";
import { Profile, type ProfileRepository } from "../profile/Profile";
import { Review } from "../reviews/Review";
import type { ReviewRepository } from "../reviews/ReviewRepository";
import { User, type PasswordHasher, type TokenService, type UserRepository } from "../users/User";

/**
 * In-memory adapters for tests and previews. They store records, not
 * instances, so callers can never mutate stored state without save().
 */
export class InMemoryEventRepository implements EventRepository {
  protected readonly records = new Map<string, ReturnType<Event["toRecord"]>>();

  async findById(id: string): Promise<Event | null> {
    const record = this.records.get(id);
    return record ? Event.restore(record) : null;
  }

  async findByOwner(ownerId: string): Promise<Event[]> {
    return [...this.records.values()].filter((r) => r.ownerId === ownerId).map((r) => Event.restore(r));
  }

  async findBySlug(ownerId: string, slug: string): Promise<Event | null> {
    for (const r of this.records.values()) if (r.ownerId === ownerId && r.slug === slug) return Event.restore(r);
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
  private readonly byOwner = new Map<string, ReturnType<Profile["toDTO"]>>();

  async findByOwner(ownerId: string): Promise<Profile | null> {
    const data = this.byOwner.get(ownerId);
    return data ? Profile.restore(data) : null;
  }

  async findByUsername(username: string): Promise<Profile | null> {
    for (const data of this.byOwner.values()) if (data.username === username) return Profile.restore(data);
    return null;
  }

  async save(profile: Profile): Promise<void> {
    this.byOwner.set(profile.ownerId, profile.toDTO());
  }
}

export class InMemoryUserRepository implements UserRepository {
  private readonly records = new Map<string, ReturnType<User["toRecord"]>>();

  async findById(id: string): Promise<User | null> {
    const r = this.records.get(id);
    return r ? User.restore(r) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const r of this.records.values()) if (r.email === email) return User.restore(r);
    return null;
  }

  async findByUsername(username: string): Promise<User | null> {
    for (const r of this.records.values()) if (r.username === username) return User.restore(r);
    return null;
  }

  async save(user: User): Promise<void> {
    this.records.set(user.id, user.toRecord());
  }
}

export class InMemoryAnalyticsRepository implements AnalyticsRepository {
  private readonly records: AnalyticsRecord[] = [];

  async add(record: AnalyticsRecord): Promise<void> {
    this.records.push(record);
  }

  async findByOwner(ownerId: string, since: Date): Promise<AnalyticsRecord[]> {
    return this.records.filter((r) => r.ownerId === ownerId && new Date(r.at) >= since);
  }
}

/** NOT secure: reversible "hash" for tests only. The API uses scrypt. */
export class PlainTextPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `plain:${password}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `plain:${password}`;
  }
}

/** NOT secure: unsigned tokens for tests only. The API signs tokens with HMAC. */
export class FakeTokenService implements TokenService {
  issue(userId: string): string {
    return `token:${userId}`;
  }

  verify(token: string): string | null {
    return token.startsWith("token:") ? token.slice(6) : null;
  }
}
