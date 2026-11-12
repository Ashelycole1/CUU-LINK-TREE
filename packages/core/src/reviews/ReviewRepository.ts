import type { Review } from "./Review";

export interface ReviewRepository {
  findByEvent(eventId: string): Promise<Review[]>;
  save(review: Review): Promise<void>;
  deleteByEvent(eventId: string): Promise<void>;
}
