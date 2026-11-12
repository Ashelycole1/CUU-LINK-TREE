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

  static fromConfig(config: Config): Container {
    return new Container(
      {
        users: new JsonUserRepository(config.dataDir),
        profiles: new JsonProfileRepository(config.dataDir),
        events: new JsonEventRepository(config.dataDir),
        reviews: new JsonReviewRepository(config.dataDir),
        analytics: new JsonAnalyticsRepository(config.dataDir),
      },
      { hasher: new ScryptPasswordHasher(), tokens: new HmacTokenService(config.authSecret) },
    );
  }
}
