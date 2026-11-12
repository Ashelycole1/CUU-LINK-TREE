import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { EventDTO } from "@event-tree/api-client";
import { SafeAreaView } from "react-native-safe-area-context";
import { EventRow } from "../../src/components/EventRow";
import { NextUpCard } from "../../src/components/NextUpCard";
import { Chip, PillSwitch } from "../../src/components/Pill";
import { api } from "../../src/lib/api";
import { useResource } from "../../src/lib/useResource";
import { StatusBar } from "expo-status-bar";
import { DEFAULT_THEME, ThemeContext, isDark, tokens } from "../../src/theme";

type Tab = "upcoming" | "past";

/** A host page at /:username: header, Next up, Upcoming/Past switch, search, chips and event rows. */
export default function TreeScreen() {
  const { username = "" } = useLocalSearchParams<{ username: string }>();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");

  const page = useResource(() => api.getPage(username), [username]);
  const theme = page.data?.profile.appearance.colors ?? DEFAULT_THEME;

  useEffect(() => {
    if (page.data) void api.recordView(username).catch(() => undefined);
  }, [page.data?.profile.ownerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onOpen = (event: EventDTO) => void api.recordClick(event.id).catch(() => undefined);

  // Both lists are already loaded, so filtering locally keeps typing instant on a phone.
  const visible = useMemo(() => {
    const source = (tab === "upcoming" ? page.data?.upcoming : page.data?.past) ?? [];
    const q = query.trim().toLowerCase();
    return source.filter(
      (e) =>
        (!category || e.category === category) &&
        (!q || [e.title, e.description, e.venue, e.organizer, e.category].some((v) => v.toLowerCase().includes(q))),
    );
  }, [tab, page.data, category, query]);

  const upcoming = page.data?.upcoming ?? [];
  const past = page.data?.past ?? [];
  const refreshing = page.loading;
  const error = page.error;
  const p = page.data?.profile;
  const initials = (p?.displayName ?? "")
    .split(/s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const header = (
    <View>
      {p?.heroImageUrl ? (
        <Image source={{ uri: p.heroImageUrl }} style={styles.hero} resizeMode="cover" />
      ) : (
        <View style={[styles.avatar, { backgroundColor: theme.card }]}>
          {p?.avatarUrl ? (
            <Image source={{ uri: p.avatarUrl }} style={StyleSheet.absoluteFill} />
          ) : (
            <Text style={[styles.avatarText, { color: theme.cardText }]}>{initials}</Text>
          )}
        </View>
      )}
      <Text style={[styles.name, { color: theme.text }]}>{p?.displayName ?? " "}</Text>
      <Text style={styles.handle}>@{username}</Text>
      {!!p?.bio && <Text style={[styles.bio, { color: theme.text }]}>{p.bio}</Text>}
      <View style={styles.pill}>
        <View style={[styles.dot, { backgroundColor: theme.accent }]} />
        <Text style={styles.pillText}>{upcoming.length} upcoming</Text>
      </View>

      {upcoming.length > 0 && (
        <>
          <Text style={styles.head}>Next up</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={278} decelerationRate="fast">
            {upcoming.slice(0, 3).map((e) => (
              <NextUpCard key={e.id} event={e} username={username} onOpen={onOpen} />
            ))}
          </ScrollView>
        </>
      )}

      <PillSwitch
        value={tab}
        onChange={setTab}
        options={[
          { id: "upcoming", label: "Upcoming", count: upcoming.length },
          { id: "past", label: "Past", count: past.length },
        ]}
      />
      <TextInput
        style={styles.search}
        placeholder="Search events"
        placeholderTextColor={tokens.muted}
        value={query}
        onChangeText={setQuery}
        accessibilityLabel="Search events"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
        {["", ...(page.data?.categories ?? [])].map((c) => (
          <Chip key={c || "all"} label={c || "All"} active={category === c} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>
      {error && <Text style={styles.error}>{error.message}</Text>}
      {refreshing && !page.data && <ActivityIndicator color={theme.text} />}
    </View>
  );

  if (error?.isNotFound) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={styles.name}>Nothing here</Text>
        <Text style={styles.bio}>There is no Event Tree at /{username} yet.</Text>
        <Pressable onPress={() => router.replace("/")} style={styles.cta} accessibilityRole="button">
          <Text style={styles.ctaText}>Go home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <ThemeContext.Provider value={theme}>
    <StatusBar style={isDark(theme.background) ? "light" : "dark"} />
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <FlatList
        data={visible}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EventRow event={item} username={username} onOpen={onOpen} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          refreshing ? undefined : (
            <Text style={styles.empty}>{tab === "upcoming" ? "Nothing coming up that matches." : "No past events match."}</Text>
          )
        }
        ListFooterComponent={<Text style={styles.footer}>Made with Event Tree</Text>}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={page.reload} tintColor="#fff" />}
      />
    </SafeAreaView>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: tokens.gutter, paddingBottom: 48 },
  hero: { width: "100%", aspectRatio: 1160 / 518, marginTop: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, overflow: "hidden", alignSelf: "center", marginTop: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 26, fontWeight: "700" },
  name: { color: "#fff", fontSize: 24, fontWeight: "600", textAlign: "center", marginTop: 12 },
  handle: { color: tokens.muted, fontSize: 14, textAlign: "center" },
  bio: { color: "#fff", fontSize: 16, fontWeight: "500", textAlign: "center", marginTop: 6, lineHeight: 24 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", height: 24, paddingHorizontal: 8, borderRadius: 8, backgroundColor: tokens.glass, marginTop: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { color: "#fff", fontSize: 12 },
  head: { color: "#fff", fontSize: 14, fontWeight: "700", textAlign: "center", marginTop: 28, marginBottom: 14 },
  search: { height: 48, borderRadius: tokens.radiusPill, backgroundColor: tokens.glass, color: "#fff", paddingHorizontal: 20, fontSize: 14, marginTop: 20, marginBottom: 10 },
  error: { color: tokens.danger, textAlign: "center", marginBottom: 12 },
  empty: { color: tokens.muted, textAlign: "center", paddingVertical: 32 },
  cta: { alignSelf: "center", marginTop: 14, paddingVertical: 12, paddingHorizontal: 22, borderRadius: tokens.radiusPill, borderWidth: 2, borderStyle: "dashed", borderColor: tokens.muted },
  ctaText: { color: "#fff", fontWeight: "600" },
  footer: { color: tokens.muted, textAlign: "center", marginTop: 32, fontSize: 13, fontWeight: "600" },
});
