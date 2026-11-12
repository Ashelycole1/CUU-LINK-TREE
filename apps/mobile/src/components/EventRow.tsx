import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Format, type EventDTO } from "@event-tree/api-client";
import { tokens, useTheme } from "../theme";

/** One event as a Linktree-style button: thumbnail, title, meta line, date chip. */
export function EventRow({ event, username, onOpen }: { event: EventDTO; username: string; onOpen?: (e: EventDTO) => void }) {
  const theme = useTheme();
  const { day, month } = Format.dayMonth(event.startsAt);
  const meta =
    event.status === "live"
      ? "● Happening now"
      : event.status === "past" && event.rating.count > 0
        ? `${Format.stars(event.rating.average)} ${event.rating.average} (${event.rating.count})`
        : event.venue || event.category;

  return (
      <Pressable
        onPress={() => {
          onOpen?.(event);
          router.push(`/${username}/${event.slug}`);
        }}
        style={({ pressed }) => [styles.row, { backgroundColor: theme.card, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        accessibilityRole="link"
        accessibilityLabel={`${event.title}, ${new Date(event.startsAt).toDateString()}`}
      >
        <View style={styles.thumb}>
          {event.coverImage ? (
            <Image source={{ uri: event.coverImage.url }} style={styles.thumbImage} />
          ) : (
            <Text style={styles.emoji}>{event.emoji}</Text>
          )}
        </View>
        <View style={styles.text}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.cardText }]}>
            {event.title}
          </Text>
          <Text numberOfLines={1} style={[styles.meta, event.status === "live" && { color: tokens.live }]}>
            {meta}
          </Text>
        </View>
        <View style={styles.date}>
          <Text style={[styles.day, { color: theme.cardText }]}>{day}</Text>
          <Text style={styles.month}>{month}</Text>
        </View>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    padding: 8,
    paddingRight: 12,
    borderRadius: tokens.radiusCard,
    marginBottom: 14,
  },
  thumb: { width: 48, height: 48, borderRadius: 20, overflow: "hidden", backgroundColor: "#eef0f5", alignItems: "center", justifyContent: "center" },
  thumbImage: { width: "100%", height: "100%" },
  emoji: { fontSize: 24 },
  text: { flex: 1, minWidth: 0 },
  title: { fontWeight: "600", fontSize: 16 },
  meta: { fontSize: 13, color: tokens.inkMuted },
  date: { width: 44, alignItems: "center" },
  day: { fontSize: 18, fontWeight: "700" },
  month: { fontSize: 11, fontWeight: "600", color: tokens.inkMuted },
});
