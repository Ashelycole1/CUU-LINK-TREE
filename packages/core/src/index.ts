// Public surface of @event-tree/core. Apps import from here only.

export * from "./dto";

export {
  DomainError,
  ValidationError,
  BusinessRuleError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "./shared/errors";
export { Entity, ValueObject } from "./shared/Entity";
export { Guard, slugify } from "./shared/guards";
export {
  type Clock,
  type IdGenerator,
  SystemClock,
  FixedClock,
  RandomIdGenerator,
  SequentialIdGenerator,
} from "./shared/ports";

export { Event } from "./events/Event";
export { EventLink, EVENT_LINK_KINDS } from "./events/EventLink";
export { ImageLink } from "./events/ImageLink";
export type { EventRepository } from "./events/EventRepository";
export { EventService } from "./events/EventService";

export { Rating } from "./reviews/Rating";
export { Review } from "./reviews/Review";
export { RatingSummary } from "./reviews/RatingSummary";
export type { ReviewRepository } from "./reviews/ReviewRepository";
export { ReviewService } from "./reviews/ReviewService";

export { Profile, type ProfileRepository } from "./profile/Profile";
export { ProfileService } from "./profile/ProfileService";
export { THEME_PRESETS, DEFAULT_THEME_ID, findTheme } from "./profile/themes";

export { Username } from "./users/Username";
export { User, type UserRepository, type PasswordHasher, type TokenService } from "./users/User";
export { AuthService } from "./users/AuthService";

export { AnalyticsService, type AnalyticsRepository } from "./analytics/AnalyticsService";

export {
  InMemoryEventRepository,
  InMemoryReviewRepository,
  InMemoryProfileRepository,
  InMemoryUserRepository,
  InMemoryAnalyticsRepository,
  PlainTextPasswordHasher,
  FakeTokenService,
} from "./infrastructure/InMemory";
