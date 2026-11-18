import type { ReviewDTO } from "@event-tree/api-client";
import { Stars } from "../../ui/Art";

export function ReviewList({ reviews }: { reviews: ReviewDTO[] }) {
  if (reviews.length === 0) return <p className="muted">No reviews yet. Be the first.</p>;
  return (
    <ul className="reviews">
      {reviews.map((r) => (
        <li key={r.id}>
          <div className="review-head">
            <b>{r.authorName}</b>
            <Stars value={r.rating} className="stars" size={14} />
          </div>
          {r.comment && <p>{r.comment}</p>}
          <time dateTime={r.createdAt}>{new Date(r.createdAt).toLocaleDateString()}</time>
        </li>
      ))}
    </ul>
  );
}
