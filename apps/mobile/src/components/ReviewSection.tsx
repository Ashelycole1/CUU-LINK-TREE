import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError, Format, type EventDTO, type ReviewDTO } from "@event-tree/api-client";
import { api } from "../lib/api";
import { useResource } from "../lib/useResource";
import { tokens, useTheme } from "../theme";
import { ErrorText, Field, PrimaryButton } from "./Field";

interface Props {
  event: EventDTO;
  onChanged: () => void;
}

/** Rating summary, the review form and the list of reviews for one event. */
export function ReviewSection({ event, onChanged }: Props) {
  const theme = useTheme();
  const reviews = useResource(() => api.listReviews(event.slug), [event.slug]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!event.acceptsReviews) {
    return <Text style={styles.note}>Reviews open once the event starts.</Text>;
  }

  async function submit() {
    if (rating === 0) return setError("Pick a star rating.");
    setBusy(true);
    setError(null);
    try {
      const review = await api.addReview(event.slug, { authorName: name, rating, comment });
      reviews.set([review, ...(reviews.data ?? [])]);
      setName("");
      setRating(0);
      setComment("");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not post your review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.summary}>
        <Text style={styles.big}>{event.rating.count ? event.rating.average.toFixed(1) : "–"}</Text>
        <View>
          <Text style={{ color: theme.accent, fontSize: 18 }}>{Format.stars(event.rating.average)}</Text>
          <Text style={styles.muted}>
            {event.rating.count} review{event.rating.count === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={styles.cardTitle}>Leave a review</Text>
        <View style={styles.stars} accessibilityRole="radiogroup" accessibilityLabel="Your rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} accessibilityRole="radio" accessibilityState={{ checked: rating === n }} accessibilityLabel={`${n} stars`} hitSlop={6}>
              <Text style={{ fontSize: 32, color: n <= rating ? theme.accent : "#d0d3db" }}>★</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Your name" value={name} onChangeText={setName} maxLength={60} />
        <Field label="What did you think? (optional)" value={comment} onChangeText={setComment} maxLength={1000} multiline />
        <ErrorText>{error}</ErrorText>
        <PrimaryButton title={busy ? "Posting…" : "Post review"} onPress={submit} disabled={busy} />
      </View>

      {(reviews.data ?? []).map((r: ReviewDTO) => (
        <View key={r.id} style={styles.review}>
          <View style={styles.reviewHead}>
            <Text style={styles.author}>{r.authorName}</Text>
            <Text style={{ color: theme.accent }}>{Format.stars(r.rating)}</Text>
          </View>
          {!!r.comment && <Text style={styles.body}>{r.comment}</Text>}
          <Text style={styles.muted}>{new Date(r.createdAt).toLocaleDateString()}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  note: { color: tokens.muted, textAlign: "center" },
  summary: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, borderRadius: tokens.radiusCard, backgroundColor: tokens.glass },
  big: { color: "#fff", fontSize: 36, fontWeight: "700" },
  muted: { color: tokens.muted, fontSize: 12 },
  card: { borderRadius: tokens.radiusCard, padding: 20, gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#14160e" },
  stars: { flexDirection: "row", gap: 4 },
  review: { padding: 14, borderRadius: 20, backgroundColor: tokens.glass, gap: 4 },
  reviewHead: { flexDirection: "row", justifyContent: "space-between" },
  author: { color: "#fff", fontWeight: "700" },
  body: { color: "#fff" },
});
