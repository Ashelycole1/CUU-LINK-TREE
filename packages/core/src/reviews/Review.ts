import { Entity } from "../shared/Entity";
import { Guard } from "../shared/guards";
import type { CreateReviewInput, ReviewRecord } from "../dto";
import { Rating } from "./Rating";

/** A star rating with an optional comment, left by someone who went to an event. */
export class Review extends Entity {
  private constructor(
    id: string,
    readonly eventId: string,
    readonly authorName: string,
    readonly rating: Rating,
    readonly comment: string,
    readonly createdAt: Date,
  ) {
    super(id);
  }

  static create(input: CreateReviewInput, ctx: { id: string; eventId: string; now: Date }): Review {
    return new Review(
      ctx.id,
      ctx.eventId,
      Guard.text(input.authorName, "Name", { min: 1, max: 60 }),
      Rating.of(input.rating),
      Guard.optionalText(input.comment, "Comment", 1000),
      ctx.now,
    );
  }

  static restore(record: ReviewRecord): Review {
    return Review.create(record, {
      id: record.id,
      eventId: record.eventId,
      now: Guard.date(record.createdAt, "createdAt"),
    });
  }

  toRecord(): ReviewRecord {
    return {
      id: this.id,
      eventId: this.eventId,
      authorName: this.authorName,
      rating: this.rating.stars,
      comment: this.comment,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
