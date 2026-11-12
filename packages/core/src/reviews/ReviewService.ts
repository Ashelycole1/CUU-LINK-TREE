import { BusinessRuleError, NotFoundError } from "../shared/errors";
import type { Clock, IdGenerator } from "../shared/ports";
import type { CreateReviewInput, RatingSummaryDTO, ReviewDTO } from "../dto";
import type { EventRepository } from "../events/EventRepository";
import { RatingSummary } from "./RatingSummary";
import { Review } from "./Review";
import type { ReviewRepository } from "./ReviewRepository";

export class ReviewService {
  constructor(
    private readonly events: EventRepository,
    private readonly reviews: ReviewRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  /** Newest first. */
  async list(eventIdOrSlug: string): Promise<ReviewDTO[]> {
    const event = await this.requireEvent(eventIdOrSlug);
    const reviews = await this.reviews.findByEvent(event.id);
    return reviews
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((review) => review.toRecord());
  }

  async summary(eventIdOrSlug: string): Promise<RatingSummaryDTO> {
    const event = await this.requireEvent(eventIdOrSlug);
    return RatingSummary.of(await this.reviews.findByEvent(event.id)).toDTO();
  }

  async add(eventIdOrSlug: string, input: CreateReviewInput): Promise<ReviewDTO> {
    const now = this.clock.now();
    const event = await this.requireEvent(eventIdOrSlug);
    if (!event.acceptsReviews(now)) {
      throw new BusinessRuleError("Reviews open once the event has started.");
    }
    const review = Review.create(input, { id: this.ids.next(), eventId: event.id, now });
    await this.reviews.save(review);
    return review.toRecord();
  }

  private async requireEvent(idOrSlug: string) {
    const event = (await this.events.findById(idOrSlug)) ?? (await this.events.findBySlug(idOrSlug));
    if (!event) throw new NotFoundError("Event", idOrSlug);
    return event;
  }
}
