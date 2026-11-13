import type { Pool } from "pg";
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

/**
 * Postgres implementations of the core repository interfaces.
 *
 * Each table keeps the columns it is looked up by (ids, email, username,
 * slug, timestamps) plus the whole record as JSONB. The domain owns the
 * record shape, so adding a field to an entity needs no migration.
 */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  username   TEXT NOT NULL UNIQUE,
  doc        JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS profiles (
  owner_id   TEXT PRIMARY KEY,
  username   TEXT NOT NULL UNIQUE,
  doc        JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL,
  slug       TEXT NOT NULL,
  doc        JSONB NOT NULL,
  UNIQUE (owner_id, slug)
);
CREATE INDEX IF NOT EXISTS events_owner_idx ON events (owner_id);
CREATE TABLE IF NOT EXISTS reviews (
  id         TEXT PRIMARY KEY,
  event_id   TEXT NOT NULL,
  doc        JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS reviews_event_idx ON reviews (event_id);
CREATE TABLE IF NOT EXISTS analytics (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL,
  at         TIMESTAMPTZ NOT NULL,
  doc        JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS analytics_owner_at_idx ON analytics (owner_id, at);
`;

/** Creates the tables if they are missing. Safe to run on every start. */
export async function migrate(pool: Pool): Promise<void> {
  await pool.query(SCHEMA);
}

async function docs<T>(pool: Pool, sql: string, params: unknown[]): Promise<T[]> {
  const result = await pool.query<{ doc: T }>(sql, params);
  return result.rows.map((row) => row.doc);
}

export class PgEventRepository implements EventRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Event | null> {
    const [record] = await docs<EventRecord>(this.pool, "SELECT doc FROM events WHERE id = $1", [id]);
    return record ? Event.restore(record) : null;
  }

  async findByOwner(ownerId: string): Promise<Event[]> {
    const records = await docs<EventRecord>(this.pool, "SELECT doc FROM events WHERE owner_id = $1", [ownerId]);
    return records.map((r) => Event.restore(r));
  }

  async findBySlug(ownerId: string, slug: string): Promise<Event | null> {
    const [record] = await docs<EventRecord>(this.pool, "SELECT doc FROM events WHERE owner_id = $1 AND slug = $2", [
      ownerId,
      slug,
    ]);
    return record ? Event.restore(record) : null;
  }

  async save(event: Event): Promise<void> {
    const r = event.toRecord();
    await this.pool.query(
      `INSERT INTO events (id, owner_id, slug, doc) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET owner_id = EXCLUDED.owner_id, slug = EXCLUDED.slug, doc = EXCLUDED.doc`,
      [r.id, r.ownerId, r.slug, JSON.stringify(r)],
    );
  }

  async delete(id: string): Promise<void> {
    await this.pool.query("DELETE FROM events WHERE id = $1", [id]);
  }
}

export class PgReviewRepository implements ReviewRepository {
  constructor(private readonly pool: Pool) {}

  async findByEvent(eventId: string): Promise<Review[]> {
    const records = await docs<ReviewRecord>(this.pool, "SELECT doc FROM reviews WHERE event_id = $1", [eventId]);
    return records.map((r) => Review.restore(r));
  }

  async save(review: Review): Promise<void> {
    const r = review.toRecord();
    await this.pool.query(
      `INSERT INTO reviews (id, event_id, doc) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET event_id = EXCLUDED.event_id, doc = EXCLUDED.doc`,
      [r.id, r.eventId, JSON.stringify(r)],
    );
  }

  async deleteByEvent(eventId: string): Promise<void> {
    await this.pool.query("DELETE FROM reviews WHERE event_id = $1", [eventId]);
  }
}

export class PgProfileRepository implements ProfileRepository {
  constructor(private readonly pool: Pool) {}

  async findByOwner(ownerId: string): Promise<Profile | null> {
    const [data] = await docs<ProfileDTO>(this.pool, "SELECT doc FROM profiles WHERE owner_id = $1", [ownerId]);
    return data ? Profile.restore(data) : null;
  }

  async findByUsername(username: string): Promise<Profile | null> {
    const [data] = await docs<ProfileDTO>(this.pool, "SELECT doc FROM profiles WHERE username = $1", [username]);
    return data ? Profile.restore(data) : null;
  }

  async save(profile: Profile): Promise<void> {
    const d = profile.toDTO();
    await this.pool.query(
      `INSERT INTO profiles (owner_id, username, doc) VALUES ($1, $2, $3)
       ON CONFLICT (owner_id) DO UPDATE SET username = EXCLUDED.username, doc = EXCLUDED.doc`,
      [d.ownerId, d.username, JSON.stringify(d)],
    );
  }
}

export class PgUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  private async find(column: "id" | "email" | "username", value: string): Promise<User | null> {
    const [record] = await docs<UserRecord>(this.pool, `SELECT doc FROM users WHERE ${column} = $1`, [value]);
    return record ? User.restore(record) : null;
  }

  findById(id: string) {
    return this.find("id", id);
  }

  findByEmail(email: string) {
    return this.find("email", email);
  }

  findByUsername(username: string) {
    return this.find("username", username);
  }

  async save(user: User): Promise<void> {
    const r = user.toRecord();
    await this.pool.query(
      `INSERT INTO users (id, email, username, doc) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, username = EXCLUDED.username, doc = EXCLUDED.doc`,
      [r.id, r.email, r.username, JSON.stringify(r)],
    );
  }
}

export class PgAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly pool: Pool) {}

  async add(record: AnalyticsRecord): Promise<void> {
    await this.pool.query("INSERT INTO analytics (id, owner_id, at, doc) VALUES ($1, $2, $3, $4)", [
      record.id,
      record.ownerId,
      record.at,
      JSON.stringify(record),
    ]);
  }

  findByOwner(ownerId: string, since: Date): Promise<AnalyticsRecord[]> {
    return docs<AnalyticsRecord>(this.pool, "SELECT doc FROM analytics WHERE owner_id = $1 AND at >= $2 ORDER BY at", [
      ownerId,
      since.toISOString(),
    ]);
  }
}
