import {
  AnalyticsService,
  AuthService,
  EventService,
  ProfileService,
  RandomIdGenerator,
  ReviewService,
  SystemClock,
  type AnalyticsRepository,
  type Clock,
  type EventRepository,
  type IdGenerator,
  type PasswordHasher,
  type ProfileRepository,
  type ReviewRepository,
  type TokenService,
  type UserRepository,
} from "@event-tree/core";
import type { Config } from "./config";
import { HmacTokenService, ScryptPasswordHasher } from "./infrastructure/crypto";
import {
  JsonAnalyticsRepository,
  JsonEventRepository,
  JsonProfileRepository,
  JsonReviewRepository,
  JsonUserRepository,
} from "./infrastructure/JsonRepositories";
import {
  PgAnalyticsRepository,
  PgEventRepository,
  PgProfileRepository,
  PgReviewRepository,
  PgUserRepository,
  migrate,
} from "./infrastructure/PostgresRepositories";
import pg from "pg";

export interface Repositories {
  users: UserRepository;
  profiles: ProfileRepository;
  events: EventRepository;
  reviews: ReviewRepository;
  analytics: AnalyticsRepository;
}

export interface Security {
  hasher: PasswordHasher;
  tokens: TokenService;
}

/**
 * Composition root: the one place where concrete classes are chosen and
 * wired together. Tests build a Container with in-memory repositories,
 * fake security and a fixed clock.
 */
export class Container {
  readonly auth: AuthService;
  readonly events: EventService;
  readonly reviews: ReviewService;
  readonly profiles: ProfileService;
  readonly analytics: AnalyticsService;

  constructor(
    readonly repositories: Repositories,
    security: Security,
    readonly clock: Clock = new SystemClock(),
    ids: IdGenerator = new RandomIdGenerator(),
  ) {
    const r = repositories;
    this.auth = new AuthService(r.users, r.profiles, security.hasher, security.tokens, clock, ids);
    this.events = new EventService(r.events, r.reviews, r.profiles, clock, ids);
    this.reviews = new ReviewService(r.events, r.reviews, clock, ids);
    this.profiles = new ProfileService(r.profiles);
    this.analytics = new AnalyticsService(r.analytics, r.profiles, r.events, clock, ids);
  }

  /** Neon Postgres when DATABASE_URL is set (required in production), JSON files otherwise. */
  static async fromConfig(config: Config): Promise<Container> {
    const security = { hasher: new ScryptPasswordHasher(), tokens: new HmacTokenService(config.authSecret) };
    if (!config.databaseUrl) return new Container(Container.jsonRepositories(config.dataDir), security);

    // Neon needs TLS with a verified certificate; local servers usually have no TLS.
    const ssl = (url: string) => (/localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: true });

    // Schema changes go over a direct connection, as Neon recommends; queries use the pooled one.
    const direct = new pg.Client({ connectionString: config.migrationUrl, ssl: ssl(config.migrationUrl) });
    await direct.connect();
    try {
      await migrate(direct);
    } finally {
      await direct.end();
    }

    const pool = new pg.Pool({ connectionString: config.databaseUrl, ssl: ssl(config.databaseUrl), max: 10, idleTimeoutMillis: 30_000 });
    // Neon suspends idle databases and drops their connections. The pool
    // replaces them on the next query; without this listener Node would crash.
    pool.on("error", (error) => console.warn("Postgres connection dropped:", error.message));
    return new Container(Container.pgRepositories(pool), security);
  }

  static jsonRepositories(dataDir: string): Repositories {
    return {
      users: new JsonUserRepository(dataDir),
      profiles: new JsonProfileRepository(dataDir),
      events: new JsonEventRepository(dataDir),
      reviews: new JsonReviewRepository(dataDir),
      analytics: new JsonAnalyticsRepository(dataDir),
    };
  }

  static pgRepositories(pool: pg.Pool): Repositories {
    return {
      users: new PgUserRepository(pool),
      profiles: new PgProfileRepository(pool),
      events: new PgEventRepository(pool),
      reviews: new PgReviewRepository(pool),
      analytics: new PgAnalyticsRepository(pool),
    };
  }
}
