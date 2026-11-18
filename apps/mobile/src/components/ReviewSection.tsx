import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError, type EventDTO, type ReviewDTO } from "@event-tree/api-client";
import { api } from "../lib/api";
import { useResource } from "../lib/useResource";
import { Icon } from "../ui/Icon";
import { Btn, InlineError, TextField } from "../ui/kit";
import { corner, usePalette } from "../ui/palette";

/** Five stars, filled up to the rounded value. Decorative; the number next to it carries the meaning. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const p = usePalette();
  const full = Math.round(value);
  return (
    <View style={{ flexDirection: "row", gap: 2 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={size} color={n <= full ? p.accentInk : p.borderStrong} fill={n <= full ? p.accentInk : "none"} />
      ))}
    </View>
  );
}

interface Props {
  event: EventDTO;
  onChanged: () => void;
}

/** The review form and the list of reviews for one event. */
export function ReviewSection({ event, onChanged }: Props) {
  const p = usePalette();
  const reviews = useResource(() => api.listReviews(event.id), [event.id]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!event.acceptsReviews) {
    return <Text style={{ color: p.textSubtle, fontSize: 14 }}>Reviews open once the doors do.</Text>;
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
      <View style={[s.form, { backgroundColor: p.bgElevated, borderColor: p.border }]}>
        <Text style={{ color: p.text, fontSize: 16, fontWeight: "800" }}>How was it?</Text>
        <View style={s.stars} accessibilityRole="radiogroup" accessibilityLabel="Your rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => setRating(n)}
              accessibilityRole="radio"
              accessibilityState={{ checked: rating === n }}
              accessibilityLabel={`${n} star${n === 1 ? "" : "s"}`}
              hitSlop={2}
              style={({ pressed }) => [s.star, { transform: [{ scale: pressed ? 0.88 : 1 }] }]}
            >
              <Icon name="star" size={32} color={n <= rating ? p.accent : p.borderStrong} fill={n <= rating ? p.accent : "none"} strokeWidth={1.75} />
            </Pressable>
          ))}
        </View>
        <TextField label="Your name" value={name} onChangeText={setName} maxLength={60} />
        <TextField label="What did you think?" optional value={comment} onChangeText={setComment} maxLength={1000} multiline />
        <InlineError>{error}</InlineError>
        <Btn title={busy ? "Posting…" : "Post review"} onPress={submit} loading={busy} />
      </View>

      {(reviews.data ?? []).map((r: ReviewDTO) => (
        <View key={r.id} style={[s.review, { borderBottomColor: p.border }]}>
          <View style={s.head}>
            <Text style={{ color: p.text, fontWeight: "800", fontSize: 15, flexShrink: 1 }} numberOfLines={1}>
              {r.authorName}
            </Text>
            <Stars value={r.rating} />
          </View>
          {!!r.comment && <Text style={{ color: p.textMuted, fontSize: 15, lineHeight: 22 }}>{r.comment}</Text>}
          <Text style={{ color: p.textSubtle, fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString()}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  form: { gap: 14, padding: 16, borderRadius: corner.lg, borderWidth: 1 },
  stars: { flexDirection: "row", gap: 4 },
  star: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  review: { gap: 6, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
});
