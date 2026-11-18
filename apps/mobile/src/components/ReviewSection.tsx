import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError, Format, type EventDTO, type ReviewDTO } from "@event-tree/api-client";
import { api } from "../lib/api";
import { useResource } from "../lib/useResource";
import { brand, onBackground, radius, space, useTheme } from "../theme";
import { Button, ErrorText, Field } from "./Field";

interface Props {
  event: EventDTO;
  onChanged: () => void;
}

/** Rating summary, the review form and the list of reviews for one event. */
export function ReviewSection({ event, onChanged }: Props) {
  const theme = useTheme();
  const c = onBackground(theme);
  const reviews = useResource(() => api.listReviews(event.id), [event.id]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!event.acceptsReviews) {
    return <Text style={[styles.note, { color: c.muted }]}>Reviews open once the event starts.</Text>;
  }

  async function submit() {
    if (rating === 0) return setError("Pick a star rating.");
    setBusy(true);
    setError(null);
    try {
      const review = await api.addReview(event.id, { authorName: name, rating, comment });
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
      <View style={[styles.summary, { backgroundColor: c.surface }]}>
        <Text style={[styles.big, { color: theme.text }]}>{event.rating.count ? event.rating.average.toFixed(1) : "–"}</Text>
        <View>
          <Text style={{ color: theme.accent, fontSize: 20 }}>{Format.stars(event.rating.average)}</Text>
          <Text style={[styles.muted, { color: c.muted }]}>
            {event.rating.count} review{event.rating.count === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Leave a review</Text>
        <View style={styles.stars} accessibilityRole="radiogroup" accessibilityLabel="Your rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} accessibilityRole="radio" accessibilityState={{ checked: rating === n }} accessibilityLabel={`${n} stars`} hitSlop={4} style={styles.star}>
              <Text style={{ fontSize: 34, lineHeight: 40, color: n <= rating ? theme.accent : brand.line }}>★</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Your name" value={name} onChangeText={setName} maxLength={60} />
        <Field label="What did you think? (optional)" value={comment} onChangeText={setComment} maxLength={1000} multiline />
        <ErrorText>{error}</ErrorText>
        <Button title={busy ? "Posting…" : "Post review"} onPress={submit} loading={busy} />
      </View>

      {(reviews.data ?? []).map((r: ReviewDTO) => (
        <View key={r.id} style={[styles.review, { backgroundColor: c.surface }]}>
          <View style={styles.reviewHead}>
            <Text style={[styles.author, { color: theme.text }]} numberOfLines={1}>{r.authorName}</Text>
            <Text style={{ color: theme.accent }}>{Format.stars(r.rating)}</Text>
          </View>
          {!!r.comment && <Text style={[styles.body, { color: theme.text }]}>{r.comment}</Text>}
          <Text style={[styles.muted, { color: c.muted }]}>{new Date(r.createdAt).toLocaleDateString()}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  note: { textAlign: "center", fontSize: 15 },
  summary: { flexDirection: "row", alignItems: "center", gap: space.lg, padding: space.lg, borderRadius: radius.card },
  big: { fontSize: 40, fontWeight: "800" },
  muted: { fontSize: 13 },
  card: { backgroundColor: brand.white, borderRadius: radius.card, padding: space.lg + 2, gap: space.md },
  cardTitle: { fontSize: 17, fontWeight: "800", color: brand.plum },
  stars: { flexDirection: "row", gap: 2 },
  star: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  review: { padding: space.lg, borderRadius: radius.card, gap: 6 },
  reviewHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.md },
  author: { fontWeight: "800", fontSize: 15, flexShrink: 1 },
  body: { fontSize: 15, lineHeight: 22 },
});
