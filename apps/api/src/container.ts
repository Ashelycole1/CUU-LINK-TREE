import {
  EventService,
  RandomIdGenerator,
  ReviewService,
  SystemClock,
  type Clock,
  type EventRepository,
  type IdGenerator,
  type ProfileRepository,
  type ReviewRepository,
} from "@event-tree/core";
import type { Config } from "./config";
import { JsonEventRepository, JsonProfileRepository, JsonReviewRepository } from "./infrastructure/JsonRepositories";

export interface Repositories {
  events: EventRepository;
  reviews: ReviewRepository;
  profile: ProfileRepository;
}

/**
 * Composition root: the one place where concrete classes are chosen and
 * wired together. Everything else receives its dependencies through its
 * constructor, so tests can build a Container with in-memory repositories
 * and a fixed clock.
 */
export class Container {
  readonly eventService: EventService;
  readonly reviewService: ReviewService;

  constructor(
    readonly repositories: Repositories,
    readonly clock: Clock = new SystemClock(),
    ids: IdGenerator = new RandomIdGenerator(),
  ) {
    this.eventService = new EventService(repositories.events, repositories.reviews, clock, ids);
    this.reviewService = new ReviewService(repositories.events, repositories.reviews, clock, ids);
  }

  static fromConfig(config: Config): Container {
    return new Container({
      events: new JsonEventRepository(config.dataDir),
      reviews: new JsonReviewRepository(config.dataDir),
      profile: new JsonProfileRepository(config.dataDir),
    });
  }
}
