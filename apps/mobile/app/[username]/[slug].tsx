import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Format } from "@event-tree/api-client";
import { Gallery } from "../../src/components/Gallery";
import { LinkButton } from "../../src/components/LinkButton";
import { ReviewSection } from "../../src/components/ReviewSection";
import { api, webUrl } from "../../src/lib/api";
import { useResource } from "../../src/lib/useResource";
import { DEFAULT_THEME, ThemeContext, onBackground, radius, space, tokens, type } from "../../src/theme";

const STATUS_LABEL = { upcoming: "Upcoming", live: "Happening now", past: "Past event" } as const;

/** One event: cover, details, link buttons, photos and reviews. */
export default function EventScreen() {
  const { username = "", slug = "" } = useLocalSearchParams<{ username: string; slug: string }>();
  const page = useResource(() => api.getPage(username), [username]);
  const event = useResource(() => api.getPageEvent(username, slug), [username, slug]);
  const theme = page.data?.profile.appearance.colors ?? DEFAULT_THEME;
  const buttonStyle = page.data?.profile.appearance.buttonStyle ?? "pill";
  const c = onBackground(theme);
  const e = event.data;

  const header = (
    <Stack.Screen
      options={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.background },
        headerRight: e
          ? () => (
              <Pressable
                onPress={() => Share.share({ message: `${e.title}, ${Format.dateRange(e.startsAt, e.endsAt)}\n${webUrl(username, e.slug)}` })}
                accessibilityRole="button"
                accessibilityLabel="Share this event"
                hitSlop={12}
                style={[styles.share, { borderColor: c.border }]}
              >
                <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}>Share</Text>
              </Pressable>
            )
          : undefined,
      }}
    />
  );

  if (!e) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        {header}
        <StatusBar style={c.statusBar} />
        {event.error ? <Text style={[styles.error, { color: c.error }]}>{event.error.message}</Text> : <ActivityIndicator color={theme.text} />}
      </View>
    );
  }

  const links = [...e.links].sort((a, b) => Number(b.primary) - Number(a.primary));
  const details = [
    { label: "When", value: Format.dateRange(e.startsAt, e.endsAt) },
    { label: "Where", value: e.venue },
    { label: "Host", value: e.organizer },
    { label: "Type", value: e.category },
  ].filter((d) => !!d.value);

  return (
    <ThemeContext.Provider value={theme}>
      {header}
      <StatusBar style={c.statusBar} />
      <ScrollView contentContainerStyle={styles.content} style={{ backgroundColor: theme.background }}>
        <View style={[styles.cover, { backgroundColor: c.surface }]}>
          {e.coverImage ? (
            <Image source={{ uri: e.coverImage.url }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={e.coverImage.alt} />
          ) : (
            <Text style={{ fontSize: 72 }}>{e.emoji}</Text>
          )}
        </View>

        <View style={styles.headline}>
          <View style={[styles.status, { backgroundColor: e.status === "live" ? tokens.live : c.surface }]}>
            {e.status === "live" && <View style={styles.liveDot} />}
            <Text style={[styles.statusText, { color: e.status === "live" ? "#fff" : theme.text }]}>{STATUS_LABEL[e.status]}</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">
            {e.title}
          </Text>
          {e.status === "upcoming" && <Text style={[styles.countdown, { color: c.muted }]}>{Format.countdown(e)}</Text>}
        </View>

        <View style={[styles.details, { backgroundColor: c.surface }]}>
          {details.map((d, i) => (
            <View key={d.label} style={[styles.detailRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
              <Text style={[styles.detailLabel, { color: c.muted }]}>{d.label}</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{d.value}</Text>
            </View>
          ))}
        </View>

        {links.length > 0 && (
          <View style={styles.links}>
            {links.map((l) => (
              <LinkButton
                key={l.url + l.label}
                label={`${Format.linkIcon(l.kind)}  ${l.label}`}
                variant={l.primary ? buttonStyle : "outline"}
                onPress={() => void Linking.openURL(l.url)}
                accessibilityLabel={l.label}
              />
            ))}
          </View>
        )}

        {!!e.description && (
          <Section title="About" color={c.muted}>
            <Text style={[styles.description, { color: theme.text }]}>{e.description}</Text>
          </Section>
        )}

        <Section title="Photos" color={c.muted}>
          <Gallery event={e} onUpdated={event.set} />
        </Section>

        <Section title="Reviews" color={c.muted}>
          <ReviewSection event={e} onChanged={event.reload} />
        </Section>
      </ScrollView>
    </ThemeContext.Provider>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color }]} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 64 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.xl },
  error: { textAlign: "center", fontSize: 16 },
  share: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1 },
  cover: { aspectRatio: 16 / 9, borderRadius: radius.card, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  headline: { alignItems: "center", marginTop: space.lg, gap: space.sm },
  status: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  statusText: { fontSize: 13, fontWeight: "700" },
  title: { ...type.title, fontSize: 28, lineHeight: 34, textAlign: "center" },
  countdown: { fontSize: 15, fontWeight: "600", textAlign: "center" },
  details: { marginTop: space.xl, borderRadius: radius.card, paddingHorizontal: space.lg },
  detailRow: { flexDirection: "row", gap: space.md, paddingVertical: 14 },
  detailLabel: { width: 56, fontSize: 14, fontWeight: "700" },
  detailValue: { flex: 1, fontSize: 16, lineHeight: 22, fontWeight: "600" },
  links: { marginTop: space.xl },
  section: { marginTop: space.xxl, gap: space.md },
  sectionTitle: { ...type.section },
  description: { ...type.body },
});
