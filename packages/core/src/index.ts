// Public surface of @event-tree/core. Apps import from here only.

export * from "./dto";

export { DomainError, ValidationError, BusinessRuleError, NotFoundError } from "./shared/errors";
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

export { Profile, DEFAULT_THEME, type ProfileRepository } from "./profile/Profile";

export {
  InMemoryEventRepository,
  InMemoryReviewRepository,
  InMemoryProfileRepository,
} from "./infrastructure/InMemory";
