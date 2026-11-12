import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { EventRow } from "../src/components/EventRow";
import { NextUpCard } from "../src/components/NextUpCard";
import { Chip, PillSwitch } from "../src/components/Pill";
import { api } from "../src/lib/api";
import { useResource } from "../src/lib/useResource";
import { tokens, useTheme } from "../src/theme";

type Tab = "upcoming" | "past";

/** The tree: profile header, Next up, Upcoming/Past switch, search, chips and event rows. */
export default function TreeScreen() {
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");

  const profile = useResource(() => api.getProfile(), []);
  const upcoming = useResource(() => api.listEvents({ when: "upcoming" }), []);
  const past = useResource(() => api.listEvents({ when: "past" }), []);
  const categories = useResource(() => api.getCategories(), []);

  // Both lists are already loaded, so filtering locally keeps typing instant on a phone.
  const visible = useMemo(() => {
    const source = (tab === "upcoming" ? upcoming.data : past.data) ?? [];
    const q = query.trim().toLowerCase();
    return source.filter(
      (e) =>
        (!category || e.category === category) &&
        (!q || [e.title, e.description, e.venue, e.organizer, e.category].some((v) => v.toLowerCase().includes(q))),
    );
  }, [tab, upcoming.data, past.data, category, query]);

  const refreshing = upcoming.loading || past.loading;
  const refresh = () => Promise.all([profile.reload(), upcoming.reload(), past.reload(), categories.reload()]);
  const error = profile.error ?? upcoming.error;
  const p = profile.data;

  const header = (
    <View>
      {p?.heroImageUrl ? (
        <Image source={{ uri: p.heroImageUrl }} style={styles.hero} resizeMode="cover" />
      ) : (
        <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
          <Text style={[styles.avatarText, { color: theme.background }]}>{p?.avatarText || "ET"}</Text>
        </View>
      )}
      <Text style={styles.name}>{p?.name ?? " "}</Text>
      {!!p?.handle && <Text style={styles.handle}>{p.handle}</Text>}
      {!!p?.bio && <Text style={styles.bio}>{p.bio}</Text>}
      <View style={styles.pill}>
        <View style={[styles.dot, { backgroundColor: theme.accent }]} />
        <Text style={styles.pillText}>{upcoming.data?.length ?? 0} upcoming</Text>
      </View>

      {!!upcoming.data?.length && (
        <>
          <Text style={styles.head}>Next up</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={278} decelerationRate="fast">
            {upcoming.data.slice(0, 3).map((e) => (
              <NextUpCard key={e.id} event={e} />
            ))}
          </ScrollView>
        </>
      )}

      <PillSwitch
        value={tab}
        onChange={setTab}
        options={[
          { id: "upcoming", label: "Upcoming", count: upcoming.data?.length ?? 0 },
          { id: "past", label: "Past", count: past.data?.length ?? 0 },
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
        {["", ...(categories.data ?? [])].map((c) => (
          <Chip key={c || "all"} label={c || "All"} active={category === c} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>
      {error && <Text style={styles.error}>{error.message}</Text>}
      {refreshing && !upcoming.data && <ActivityIndicator color="#fff" />}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <FlatList
        data={visible}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EventRow event={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          refreshing ? null : (
            <Text style={styles.empty}>{tab === "upcoming" ? "Nothing coming up that matches." : "No past events match."}</Text>
          )
        }
        ListFooterComponent={
          <Link href="/new" asChild>
            <Pressable style={styles.cta} accessibilityRole="button">
              <Text style={styles.ctaText}>+ Post an upcoming event</Text>
            </Pressable>
          </Link>
        }
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor="#fff" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: tokens.gutter, paddingBottom: 48 },
  hero: { width: "100%", aspectRatio: 1160 / 518, marginTop: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, alignSelf: "center", marginTop: 24, alignItems: "center", justifyContent: "center" },
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
});
