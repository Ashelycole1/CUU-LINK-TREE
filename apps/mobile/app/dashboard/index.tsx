import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Share, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, Stack, router, useFocusEffect } from "expo-router";
import { ApiError, type EventDTO } from "@event-tree/api-client";
import { useAuth } from "../../src/auth/AuthContext";
import { WEB_HOST, api, webUrl } from "../../src/lib/api";
import { flash } from "../../src/lib/flash";
import { useResource } from "../../src/lib/useResource";
import { dayNumber, monthShort, whenLine } from "../../src/ui/dates";
import { Icon } from "../../src/ui/Icon";
import { CoverArt, InlineError } from "../../src/ui/kit";
import { corner, gap, usePalette } from "../../src/ui/palette";
import { ActionSheet } from "../../src/ui/Sheet";

const STATUS = { upcoming: "Upcoming", live: "Live now", past: "Ended" } as const;

/**
 * Your events as a numbered track list, in the order they appear on your
 * page. Switch one off to hide it; ⋯ moves or deletes it. Add event is the
 * big yellow button in thumb reach.
 */
export default function DashboardScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { identity, user, checking, logout } = useAuth();
  const events = useResource(() => (user ? api.listMyEvents() : Promise.resolve([])), [user?.id]);
  const profile = useResource(() => (user ? api.getMyProfile() : Promise.resolve(null)), [user?.id]);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [published, setPublished] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<number | null>(null);

  // Reload when coming back from the add-event screen, and say where the new event went.
  useFocusEffect(
    useCallback(() => {
      void events.reload();
      const title = flash.take();
      if (title) {
        setNotice(null);
        setPublished(title);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (checking) return <ActivityIndicator style={{ marginTop: 48 }} color={p.text} />;
  if (!identity) return <Redirect href="/login" />;
  if (!user) return <Redirect href="/claim" />;

  const list = events.data ?? [];
  const live = list.filter((e) => e.status === "live" && !e.hidden).length;
  const upcoming = list.filter((e) => e.status === "upcoming" && !e.hidden).length;
  const shown = list.filter((e) => !e.hidden).length;
  const name = profile.data?.displayName ?? user.username;
  const target = menuFor === null ? null : list[menuFor] ?? null;

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      await events.reload();
      setNotice({ text: message, ok: true });
    } catch (err) {
      setNotice({ text: err instanceof ApiError ? err.message : "That didn't work. Try again.", ok: false });
    }
  }

  function move(index: number, direction: -1 | 1) {
    const ids = list.map((e) => e.id);
    const to = index + direction;
    [ids[index], ids[to]] = [ids[to]!, ids[index]!];
    events.set(ids.map((id) => list.find((e) => e.id === id)!));
    void run(() => api.reorderEvents(ids), "Order saved");
  }

  function confirmDelete(event: EventDTO) {
    Alert.alert(`Delete "${event.title}"?`, "This removes the event, its photos and its reviews. You can't undo this.", [
      { text: "Keep it", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void run(() => api.deleteEvent(event.id), "Event deleted") },
    ]);
  }

  async function refresh() {
    setRefreshing(true);
    await Promise.all([events.reload(), profile.reload()]);
    setRefreshing(false);
  }

  const header = (
    <View style={{ gap: gap.xl, marginBottom: gap.lg }}>
      <View style={{ gap: 6 }}>
        <Text style={[s.kicker, { color: p.textSubtle }]}>{name}</Text>
        <Text style={[s.h1, { color: p.text }]} accessibilityRole="header">
          Your events
        </Text>
      </View>

      {/* Your page: the link you share, with share and open. */}
      <View style={[s.page, { backgroundColor: p.bgElevated, borderColor: p.border }]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: p.textSubtle, fontSize: 13, fontWeight: "700" }}>Your page</Text>
          <Text style={{ color: p.text, fontSize: 16, fontWeight: "800", marginTop: 2 }} numberOfLines={1}>
            {WEB_HOST}/{user.username}
          </Text>
        </View>
        <Pressable
          onPress={() => void Share.share({ message: webUrl(user.username) })}
          accessibilityRole="button"
          accessibilityLabel="Share your page"
          hitSlop={6}
          style={[s.round, { backgroundColor: p.surface }]}
        >
          <Icon name="share" size={18} color={p.text} />
        </Pressable>
        <Pressable
          onPress={() => router.push(`/${user.username}`)}
          accessibilityRole="link"
          accessibilityLabel="Open your page"
          hitSlop={6}
          style={[s.round, { backgroundColor: p.accent }]}
        >
          <Icon name="play" size={18} color={p.onAccent} fill={p.onAccent} />
        </Pressable>
      </View>

      {/* The scoreboard. */}
      <View style={s.score}>
        {[
          { n: live, l: "live now", hot: live > 0 },
          { n: upcoming, l: "upcoming" },
          { n: shown, l: `of ${list.length} shown` },
        ].map((x) => (
          <View key={x.l} style={{ flex: 1 }}>
            <Text style={[s.scoreN, { color: x.hot ? p.accentInk : p.text }]}>{x.n}</Text>
            <Text style={{ color: p.textSubtle, fontSize: 13, fontWeight: "600" }}>{x.l}</Text>
          </View>
        ))}
      </View>

      {!!published && (
        <View style={[s.published, { backgroundColor: p.surface }]} accessibilityRole="alert">
          <View style={[s.check, { backgroundColor: p.accent }]}>
            <Icon name="check" size={18} color={p.onAccent} strokeWidth={3} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: p.text, fontWeight: "800", fontSize: 15 }} numberOfLines={2}>
              {published} is on your page
            </Text>
            <Pressable onPress={() => router.push(`/${user.username}`)} accessibilityRole="link" hitSlop={6}>
              <Text style={{ color: p.text, textDecorationLine: "underline", fontWeight: "600", marginTop: 2 }}>See it</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => setPublished(null)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Dismiss">
            <Icon name="close" size={18} color={p.textMuted} />
          </Pressable>
        </View>
      )}

      {notice?.ok ? (
        <Text style={{ color: p.success, fontWeight: "700" }} accessibilityLiveRegion="polite">
          {notice.text}
        </Text>
      ) : (
        <InlineError>{notice?.text}</InlineError>
      )}
      {!!events.error && <InlineError>{events.error.message}</InlineError>}

      {list.length > 0 && (
        <View style={[s.colHead, { borderBottomColor: p.border }]}>
          <Text style={[s.colText, { color: p.textSubtle, width: 28 }]}>#</Text>
          <Text style={[s.colText, { color: p.textSubtle, flex: 1 }]}>Event</Text>
          <Text style={[s.colText, { color: p.textSubtle }]}>Shown</Text>
        </View>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => void logout().then(() => router.replace("/"))}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Log out"
              style={{ padding: 4 }}
            >
              <Icon name="logout" size={20} color={p.textMuted} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        style={{ backgroundColor: p.bg }}
        data={list}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: gap.lg, paddingBottom: 120 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={p.text} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          events.loading ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={p.text} />
          ) : (
            <View style={s.empty}>
              <View style={[s.emptyArt, { backgroundColor: p.surface }]}>
                <Icon name="calendar" size={32} color={p.textMuted} />
              </View>
              <Text style={{ color: p.text, fontSize: 20, fontWeight: "800" }}>Nothing on your page yet</Text>
              <Text style={{ color: p.textMuted, fontSize: 15, textAlign: "center", lineHeight: 21 }}>
                Add your first event. It goes live on your page the moment you save it.
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => router.push(`/${user.username}/${item.slug}`)}
            onLongPress={() => setMenuFor(index)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${whenLine(item.startsAt)}${item.hidden ? ", hidden" : ""}`}
            style={({ pressed }) => [s.row, { backgroundColor: pressed ? p.surface : "transparent" }]}
          >
            <Text style={[s.num, { color: item.status === "live" ? p.accentInk : p.textSubtle }]}>{index + 1}</Text>
            <View style={{ opacity: item.hidden ? 0.4 : 1 }}>
              <CoverArt uri={item.coverImage?.url} name={item.title} category={item.category} size={52} />
            </View>
            <View style={{ flex: 1, minWidth: 0, opacity: item.hidden ? 0.5 : 1 }}>
              <Text style={{ color: p.text, fontSize: 16, fontWeight: "700" }} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={{ color: p.textSubtle, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                {item.status === "live" ? (
                  <Text style={{ color: p.accentInk, fontWeight: "800" }}>Live now · </Text>
                ) : (
                  `${STATUS[item.status]} · `
                )}
                {dayNumber(item.startsAt)} {monthShort(item.startsAt)}
                {item.hidden ? " · Hidden" : ""}
              </Text>
            </View>
            <Switch
              value={!item.hidden}
              onValueChange={() =>
                void run(() => api.updateEvent(item.id, { hidden: !item.hidden }), item.hidden ? "Shown on your page" : "Hidden from your page")
              }
              trackColor={{ true: p.accent, false: p.surfaceHigh }}
              thumbColor="#ffffff"
              ios_backgroundColor={p.surfaceHigh}
              accessibilityLabel={`Show ${item.title} on your page`}
            />
            <Pressable onPress={() => setMenuFor(index)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`More for ${item.title}`} style={s.more}>
              <Icon name="more" size={20} color={p.textMuted} />
            </Pressable>
          </Pressable>
        )}
      />

      <ActionSheet
        title={target?.title ?? null}
        onClose={() => setMenuFor(null)}
        actions={
          target && menuFor !== null
            ? [
                { label: "Open event page", icon: "external", onPress: () => router.push(`/${user.username}/${target.slug}`) },
                { label: "Move up", icon: "upArrow", disabled: menuFor === 0, onPress: () => move(menuFor, -1) },
                { label: "Move down", icon: "down", disabled: menuFor === list.length - 1, onPress: () => move(menuFor, 1) },
                { label: "Delete", icon: "trash", danger: true, onPress: () => confirmDelete(target) },
              ]
            : []
        }
      />

      {/* The one big action, in thumb reach. */}
      <Pressable
        onPress={() => router.push("/dashboard/new")}
        accessibilityRole="button"
        accessibilityLabel="Add event"
        style={({ pressed }) => [s.fab, { backgroundColor: p.accent, bottom: 20 + insets.bottom, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
      >
        <Icon name="plus" size={22} color={p.onAccent} strokeWidth={2.5} />
        <Text style={{ color: p.onAccent, fontWeight: "800", fontSize: 16 }}>Add event</Text>
      </Pressable>
    </>
  );
}

const s = StyleSheet.create({
  kicker: { fontSize: 14, fontWeight: "700" },
  h1: { fontSize: 34, lineHeight: 38, fontWeight: "900", letterSpacing: -1 },
  page: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: corner.lg, borderWidth: 1 },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  score: { flexDirection: "row", gap: gap.md },
  scoreN: { fontSize: 32, fontWeight: "900", fontVariant: ["tabular-nums"], letterSpacing: -1 },
  published: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: corner.lg },
  check: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  colHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  colText: { fontSize: 12, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, paddingHorizontal: 8, borderRadius: corner.md },
  num: { width: 16, textAlign: "center", fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
  more: { width: 32, height: 40, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  emptyArt: { width: 80, height: 80, borderRadius: corner.lg, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  fab: { position: "absolute", right: 16, flexDirection: "row", alignItems: "center", gap: 8, height: 56, paddingHorizontal: 22, borderRadius: 28, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
});
