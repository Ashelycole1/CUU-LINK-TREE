import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Format } from "@event-tree/api-client";
import { Gallery } from "../../src/components/Gallery";
import { ReviewSection } from "../../src/components/ReviewSection";
import { api } from "../../src/lib/api";
import { useResource } from "../../src/lib/useResource";
import { tokens, useTheme } from "../../src/theme";

const STATUS_LABEL = { upcoming: "Upcoming", live: "Happening now", past: "Past event" } as const;

/** One event: cover, details, link buttons, photos and reviews. */
export default function EventScreen() {
  const theme = useTheme();
  const { slug = "" } = useLocalSearchParams<{ slug: string }>();
  const event = useResource(() => api.getEvent(slug), [slug]);
  const e = event.data;

  if (!e) {
    return (
      <View style={styles.center}>
        {event.error ? <Text style={styles.error}>{event.error.message}</Text> : <ActivityIndicator color="#fff" />}
      </View>
    );
  }

  const links = [...e.links].sort((a, b) => Number(b.primary) - Number(a.primary));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => Share.share({ message: `${e.title}: ${Format.dateRange(e.startsAt, e.endsAt)}` })} accessibilityLabel="Share this event" hitSlop={10}>
              <Text style={{ color: theme.text, fontSize: 20 }}>↗</Text>
            </Pressable>
          ),
        }}
      />
      <View style={styles.cover}>
        {e.coverImage ? (
          <Image source={{ uri: e.coverImage.url }} style={StyleSheet.absoluteFill} accessibilityLabel={e.coverImage.alt} />
        ) : (
          <Text style={{ fontSize: 72 }}>{e.emoji}</Text>
        )}
      </View>

      <Text style={[styles.status, e.status === "live" && { backgroundColor: tokens.live }]}>{STATUS_LABEL[e.status]}</Text>
      <Text style={styles.title}>{e.title}</Text>
      <Text style={styles.when}>{Format.dateRange(e.startsAt, e.endsAt)}</Text>
      <Text style={styles.muted}>{[e.venue, e.organizer, e.category].filter(Boolean).join(" · ")}</Text>
      {e.status === "upcoming" && <Text style={[styles.countdown, { color: theme.accent }]}>{Format.countdown(e)}</Text>}
      {!!e.description && <Text style={styles.description}>{e.description}</Text>}

      <View style={{ gap: 12, marginTop: 20 }}>
        {links.map((l) => (
          <Pressable
            key={l.url + l.label}
            onPress={() => Linking.openURL(l.url)}
            style={[styles.link, l.primary && { backgroundColor: theme.card }]}
            accessibilityRole="link"
          >
            <Text style={[styles.linkText, l.primary && { color: theme.cardText }]}>
              {Format.linkIcon(l.kind)} {l.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.head}>Photos</Text>
      <Gallery event={e} onUpdated={event.set} />

      <Text style={styles.head}>Reviews</Text>
      <ReviewSection event={e} onChanged={event.reload} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: tokens.gutter, paddingBottom: 64 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: tokens.danger, textAlign: "center" },
  cover: { aspectRatio: 16 / 9, borderRadius: tokens.radiusCard, overflow: "hidden", backgroundColor: tokens.glass, alignItems: "center", justifyContent: "center" },
  status: { alignSelf: "center", marginTop: 18, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8, overflow: "hidden", backgroundColor: tokens.glass, color: "#fff", fontSize: 12, fontWeight: "600" },
  title: { color: "#fff", fontSize: 26, fontWeight: "700", textAlign: "center", marginTop: 6 },
  when: { color: "#fff", fontWeight: "600", textAlign: "center", marginTop: 8 },
  muted: { color: tokens.muted, textAlign: "center" },
  countdown: { fontWeight: "600", textAlign: "center", marginTop: 6 },
  description: { color: "#fff", marginTop: 16, lineHeight: 22 },
  link: { padding: 16, borderRadius: tokens.radiusPill, backgroundColor: tokens.glass, alignItems: "center" },
  linkText: { color: "#fff", fontWeight: "600" },
  head: { color: "#fff", fontSize: 14, fontWeight: "700", textAlign: "center", marginTop: 28, marginBottom: 14 },
});
