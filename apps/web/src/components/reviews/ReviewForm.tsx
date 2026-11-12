import { useState, type FormEvent } from "react";
import { ApiError, type ReviewDTO } from "@event-tree/api-client";
import { api } from "../../lib/api";
import { StarInput } from "./StarInput";

interface Props {
  eventSlug: string;
  onAdded: (review: ReviewDTO) => void;
}

export function ReviewForm({ eventSlug, onAdded }: Props) {
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (rating === 0) return setError("Pick a star rating.");
    setBusy(true);
    setError("");
    try {
      onAdded(await api().addReview(eventSlug, { authorName, rating, comment }));
      setAuthorName("");
      setRating(0);
      setComment("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not post your review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h3>Leave a review</h3>
      <StarInput value={rating} onChange={setRating} />
      <label>
        Your name
        <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={60} required />
      </label>
      <label>
        What did you think? <span className="muted">(optional)</span>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>
        {busy ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}
