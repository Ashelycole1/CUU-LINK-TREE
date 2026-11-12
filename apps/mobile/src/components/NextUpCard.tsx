import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Format, type EventDTO } from "@event-tree/api-client";
import { tokens, useTheme } from "../theme";

/** 264px card for the horizontal "Next up" row, with a ticking countdown. */
export function NextUpCard({ event, username, onOpen }: { event: EventDTO; username: string; onOpen?: (e: EventDTO) => void }) {
  const theme = useTheme();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const countdown = Format.countdown(event, now);

  return (
      <Pressable onPress={() => {
          onOpen?.(event);
          router.push(`/${username}/${event.slug}`);
        }} style={[styles.card, { backgroundColor: theme.card }]} accessibilityRole="link">
        <View style={styles.image}>
          {event.coverImage ? (
            <Image source={{ uri: event.coverImage.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 48 }}>{event.emoji}</Text>
          )}
        </View>
        <Text numberOfLines={2} style={[styles.title, { color: theme.cardText }]}>
          {event.title}
        </Text>
        <Text style={[styles.countdown, countdown === "Happening now" && { color: tokens.live }]}>{countdown}</Text>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 264, padding: 16, borderRadius: tokens.radiusCard, marginRight: 14, gap: 6 },
  image: { height: 132, borderRadius: 16, overflow: "hidden", backgroundColor: "#eef0f5", alignItems: "center", justifyContent: "center" },
  title: { fontWeight: "600", fontSize: 16 },
  countdown: { fontSize: 13, fontWeight: "600", color: tokens.inkMuted },
});
