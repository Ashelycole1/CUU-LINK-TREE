import { ValueObject } from "../shared/Entity";
import { ValidationError } from "../shared/errors";

/** A whole number of stars from 1 to 5. */
export class Rating extends ValueObject<{ stars: number }> {
  static readonly MIN = 1;
  static readonly MAX = 5;

  private constructor(stars: number) {
    super({ stars });
  }

  static of(value: unknown): Rating {
    const stars = Number(value);
    if (!Number.isInteger(stars) || stars < Rating.MIN || stars > Rating.MAX) {
      throw new ValidationError(`Rating must be a whole number from ${Rating.MIN} to ${Rating.MAX}.`, "rating");
    }
    return new Rating(stars);
  }

  get stars(): number {
    return this.props.stars;
  }
}
