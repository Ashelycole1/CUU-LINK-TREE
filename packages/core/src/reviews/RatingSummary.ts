import type { RatingSummaryDTO } from "../dto";
import type { Review } from "./Review";

/** Aggregates a set of reviews into a count, an average and a star histogram. */
export class RatingSummary {
  private constructor(private readonly reviews: readonly Review[]) {}

  static of(reviews: readonly Review[]): RatingSummary {
    return new RatingSummary(reviews);
  }

  static empty(): RatingSummaryDTO {
    return { count: 0, average: 0, distribution: [0, 0, 0, 0, 0] };
  }

  toDTO(): RatingSummaryDTO {
    const distribution: RatingSummaryDTO["distribution"] = [0, 0, 0, 0, 0];
    let total = 0;
    for (const review of this.reviews) {
      const stars = review.rating.stars;
      distribution[stars - 1] = (distribution[stars - 1] ?? 0) + 1;
      total += stars;
    }
    const count = this.reviews.length;
    const average = count === 0 ? 0 : Math.round((total / count) * 10) / 10;
    return { count, average, distribution };
  }
}
