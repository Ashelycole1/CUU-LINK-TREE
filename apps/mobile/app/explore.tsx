import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CommunityEventDTO } from "@event-tree/api-client";
import { api } from "../src/lib/api";
import { useResource } from "../src/lib/useResource";
import { dayNumber, headerTint, monthShort, startsIn, timeShort, weekdayShort } from "../src/ui/dates";
import { Icon, categoryIcon } from "../src/ui/Icon";
import { Chip, CoverArt, hashColour } from "../src/ui/kit";
import { corner, gap, usePalette } from "../src/ui/palette";

const WEEK = 7 * 86_400_000;

function group(items: CommunityEventDTO[], now = Date.now()) {
  const soon = (x: CommunityEventDTO) => new Date(x.event.startsAt).getTime() - now < WEEK;
  return [
    { id: "now", title: "Happening now", items: items.filter((x) => x.event.status === "live") },
    { id: "week", title: "This week", items: items.filter((x) => x.event.status !== "live" && soon(x)) },
    { id: "later", title: "Coming up", items: items.filter((x) => x.event.status !== "live" && !soon(x)) },
  ].filter((g) => g.items.length > 0);
}

/** Community: upcoming events from every Event Tree page, grouped by when they happen, filtered by category. */
export default function CommunityScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const data = useResource(() => api.getCommunity({ limit: 100 }), []);
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const all = data.data?.events ?? [];
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return group(
      all.filter(
        ({ event: e, host }) =>
          (!category || e.category === category) &&
          (!needle || [e.title, e.venue, e.category, host.displayName].some((v) => v?.toLowerCase().includes(needle))),
      ),
    );
  }, [all, category, q]);

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      keyboardShouldPersistTaps="handled"
      stickyHeaderIndices={[1]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={p.text}
          onRefresh={async () => {
            setRefreshing(true);
            await data.reload();
            setRefreshing(false);
          }}
        />
      }
    >
      <View style={s.head}>
        <Text style={{ color: p.accentInk, fontSize: 14, fontWeight: "800" }}>Community</Text>
        <Text style={[s.h1, { color: p.text }]} accessibilityRole="header">
          What's on
        </Text>
        <Text style={{ color: p.textMuted, fontSize: 16, lineHeight: 22 }}>Upcoming events from every Event Tree page.</Text>
      </View>

      {/* Search and categories stay on screen while scrolling. */}
      <View style={[s.bar, { backgroundColor: p.bg, borderBottomColor: p.border }]}>
        <View style={[s.search, { backgroundColor: p.surface }]}>
          <Icon name="search" size={18} color={p.textSubtle} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search events, venues, hosts"
            placeholderTextColor={p.textSubtle}
            selectionColor={p.accent}
            returnKeyType="search"
            accessibilityLabel="Search events"
            style={{ flex: 1, color: p.text, fontSize: 16 }}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: gap.lg }}>
          <Chip label={`All ${all.length}`} selected={!category} onPress={() => setCategory("")} />
          {(data.data?.categories ?? []).map((c) => (
            <Chip
              key={c.name}
              label={`${c.name} ${c.count}`}
              icon={categoryIcon(c.name)}
              selected={category === c.name}
              onPress={() => setCategory(category === c.name ? "" : c.name)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={{ paddingHorizontal: gap.lg }}>
        {data.loading && !data.data && <ActivityIndicator color={p.text} style={{ marginTop: 40 }} />}
        {!!data.error && <Text style={{ color: p.danger, marginTop: 24, textAlign: "center" }}>{data.error.message}</Text>}
        {data.data && groups.length === 0 && (
          <View style={s.empty}>
            <Icon name="calendar" size={32} color={p.textSubtle} />
            <Text style={{ color: p.text, fontSize: 20, fontWeight: "800" }}>{all.length === 0 ? "Nothing announced yet" : "No events match"}</Text>
            <Text style={{ color: p.textSubtle, textAlign: "center" }}>
              {all.length === 0 ? "When hosts add upcoming events, they show up here." : "Try another category or search."}
            </Text>
          </View>
        )}

        {groups.map((g) => (
          <View key={g.id} style={{ marginTop: gap.xl, gap: gap.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {g.id === "now" && <View style={[s.pip, { backgroundColor: p.accent }]} />}
              <Text style={{ color: p.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.4 }} accessibilityRole="header">
                {g.title} <Text style={{ color: p.textSubtle, fontWeight: "700" }}>{g.items.length}</Text>
              </Text>
            </View>
            <View style={s.grid}>
              {g.items.map(({ event: e, host }) => (
                <Pressable
                  key={e.id}
                  onPress={() => router.push(`/${host.username}/${e.slug}`)}
                  accessibilityRole="link"
                  accessibilityLabel={`${e.title}, ${weekdayShort(e.startsAt)} ${dayNumber(e.startsAt)} ${monthShort(e.startsAt)}, by ${host.displayName}`}
                  style={({ pressed }) => [s.card, { opacity: pressed ? 0.8 : 1 }]}
                >
                  <View style={[s.art, { backgroundColor: headerTint(host.color, p) }]}>
                    <CoverArt uri={e.coverImage?.url} name={e.title} category={e.category} size="fill" radius={0} />
                    <View style={[s.leaf, { backgroundColor: p.bgElevated }]}>
                      <Text style={[s.leafMonth, { backgroundColor: p.accent, color: p.onAccent }]}>{monthShort(e.startsAt).toUpperCase()}</Text>
                      <Text style={{ color: p.text, fontSize: 18, fontWeight: "900", paddingVertical: 2 }}>{dayNumber(e.startsAt)}</Text>
                    </View>
                  </View>
                  <Text style={{ color: p.text, fontSize: 15, fontWeight: "700" }} numberOfLines={2}>
                    {e.title}
                  </Text>
                  <Text style={{ color: e.status === "live" ? p.accentInk : p.textMuted, fontSize: 13, fontWeight: e.status === "live" ? "800" : "400" }} numberOfLines={1}>
                    {e.status === "live" ? "Happening now" : `${weekdayShort(e.startsAt)} ${timeShort(e.startsAt)} · ${startsIn(e.startsAt, e.endsAt).replace("Starts ", "")}`}
                  </Text>
                  <View style={s.host}>
                    <View style={[s.hostDot, { backgroundColor: hashColour(host.displayName) }]}>
                      <Icon name="user" size={11} color="#fff" />
                    </View>
                    <Text style={{ color: p.textSubtle, fontSize: 12, fontWeight: "700", flexShrink: 1 }} numberOfLines={1}>
                      {host.displayName}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: gap.lg, paddingTop: gap.lg, paddingBottom: gap.lg, gap: 6 },
  h1: { fontSize: 44, lineHeight: 48, fontWeight: "900", letterSpacing: -1.5 },
  bar: { gap: 10, paddingTop: 8, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  search: { flexDirection: "row", alignItems: "center", gap: 10, height: 46, marginHorizontal: gap.lg, paddingHorizontal: 14, borderRadius: corner.pill },
  pip: { width: 8, height: 8, borderRadius: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: gap.lg },
  card: { width: "48%", gap: 4 },
  art: { aspectRatio: 1, borderRadius: corner.md, overflow: "hidden", marginBottom: 6 },
  leaf: { position: "absolute", left: 8, top: 8, minWidth: 40, borderRadius: corner.sm, overflow: "hidden", alignItems: "center" },
  leafMonth: { alignSelf: "stretch", textAlign: "center", fontSize: 10, fontWeight: "900", paddingVertical: 2 },
  host: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  hostDot: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 56 },
});
