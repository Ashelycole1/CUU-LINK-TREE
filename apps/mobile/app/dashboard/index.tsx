import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Animated, Easing, FlatList, Image, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, Stack, router, useFocusEffect } from "expo-router";
import { ApiError, Format, type EventDTO } from "@event-tree/api-client";
import { useAuth } from "../../src/auth/AuthContext";
import { Button, ErrorText, NoticeText, SectionTitle } from "../../src/components/Field";
import { WEB_HOST, api } from "../../src/lib/api";
import { flash } from "../../src/lib/flash";
import { useResource } from "../../src/lib/useResource";
import { brand, radius, shadow, space, type } from "../../src/theme";

/** The host's events: show/hide, reorder, delete, add. The phone version of the web dashboard. */
export default function DashboardScreen() {
  const { identity, user, checking, logout } = useAuth();
  const events = useResource(() => (user ? api.listMyEvents() : Promise.resolve([])), [user?.id]);
  const profile = useResource(() => (user ? api.getMyProfile() : Promise.resolve(null)), [user?.id]);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [published, setPublished] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Reload when coming back from the add-event screen, and celebrate a new event.
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

  if (checking) return <ActivityIndicator style={{ marginTop: 48 }} color={brand.plum} />;
  if (!identity) return <Redirect href="/login" />;
  if (!user) return <Redirect href="/claim" />;
  const list = events.data ?? [];
  const shown = list.filter((e) => !e.hidden).length;
  const live = list.filter((e) => e.status === "live" && !e.hidden).length;
  const upcoming = list.filter((e) => e.status === "upcoming" && !e.hidden).length;
  const firstName = (profile.data?.displayName ?? user.username).split(/\s+/)[0];

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
    const target = index + direction;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
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
    await events.reload();
    setRefreshing(false);
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => {
                void logout().then(() => router.replace("/"));
              }}
              hitSlop={12}
              accessibilityRole="button"
              style={styles.headerButton}
            >
              <Text style={styles.headerLink}>Log out</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={brand.plum} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.greeting}>
              <Text style={styles.hello} accessibilityRole="header">
                Hi {firstName} 👋
              </Text>
              <View style={styles.chips}>
                {live > 0 && (
                  <View style={[styles.chip, styles.chipLive]}>
                    <View style={styles.chipDot} />
                    <Text style={[styles.chipText, { color: brand.plum }]}>
                      <Text style={styles.chipNum}>{live}</Text> live now
                    </Text>
                  </View>
                )}
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    <Text style={styles.chipNum}>{upcoming}</Text> upcoming
                  </Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    <Text style={styles.chipNum}>{shown}</Text> of {list.length} shown
                  </Text>
                </View>
              </View>
            </View>

            {!!published && <Celebration title={published} onView={() => router.push(`/${user.username}`)} onClose={() => setPublished(null)} />}

            <Pressable
              onPress={() => router.push(`/${user.username}`)}
              style={({ pressed }) => [styles.pageCard, pressed && { opacity: 0.9 }]}
              accessibilityRole="link"
              accessibilityLabel={`Open your page, ${WEB_HOST}/${user.username}`}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.pageLabel}>Your page is live</Text>
                <Text style={styles.pageUrl} numberOfLines={1}>
                  {WEB_HOST}/{user.username}
                </Text>
              </View>
              <Text style={styles.pageChevron}>›</Text>
            </Pressable>

            {notice?.ok ? <NoticeText>{notice.text}</NoticeText> : <ErrorText>{notice?.text}</ErrorText>}
            {!!events.error && <ErrorText>{events.error.message}</ErrorText>}
            {list.length > 0 && <SectionTitle>Your events</SectionTitle>}
          </View>
        }
        ListEmptyComponent={
          events.loading ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={brand.plum} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptyBody}>Add your first event and it will appear on your page straight away.</Text>
              <Text style={styles.emptyArrow}>↓</Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        renderItem={({ item, index }) => (
          <View style={[styles.card, item.hidden && styles.cardHidden]}>
            <View style={styles.row}>
              <View style={[styles.thumb, item.hidden && { opacity: 0.5 }]}>
                {item.coverImage ? (
                  <Image source={{ uri: item.coverImage.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
                )}
              </View>
              <View style={[styles.body, item.hidden && { opacity: 0.6 }]}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {Format.dateRange(item.startsAt, item.endsAt)}
                </Text>
                {item.hidden && <Text style={styles.hiddenTag}>Hidden from your page</Text>}
              </View>
              <Switch
                value={!item.hidden}
                onValueChange={() => void run(() => api.updateEvent(item.id, { hidden: !item.hidden }), item.hidden ? "Shown on your page" : "Hidden from your page")}
                trackColor={{ true: brand.ok, false: "#cfc2b0" }}
                accessibilityLabel={`Show ${item.title} on your page`}
              />
            </View>

            <View style={styles.actions}>
              <IconAction label="Move up" glyph="↑" disabled={index === 0} onPress={() => move(index, -1)} a11y={`Move ${item.title} up`} />
              <IconAction label="Move down" glyph="↓" disabled={index === list.length - 1} onPress={() => move(index, 1)} a11y={`Move ${item.title} down`} />
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={() => confirmDelete(item)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.title}`}
                style={({ pressed }) => [styles.action, styles.deleteAction, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* Primary action lives in the thumb zone. */}
      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.lg) }]} pointerEvents="box-none">
        <Button
          title="Add event"
          icon={<Text style={styles.plus}>+</Text>}
          onPress={() => router.push("/dashboard/new")}
          style={shadow.pink}
        />
      </View>
    </>
  );
}

/** The peak moment of the host's flow: their event just went live. A pop, a few sparks, and a way to go see it. */
function Celebration({ title, onView, onClose }: { title: string; onView: () => void; onClose: () => void }) {
  const [enter] = useState(() => new Animated.Value(0));
  const [pop] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.parallel([
      Animated.timing(enter, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 120, delay: 120, useNativeDriver: true }),
    ]).start();
  }, [enter, pop]);

  return (
    <Animated.View
      accessibilityRole="alert"
      style={[
        styles.celebrate,
        { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
      ]}
    >
      <View style={styles.celebrateRow}>
        <Animated.View style={[styles.celebrateEmoji, { transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }]}>
          <Text style={{ fontSize: 22 }}>🎉</Text>
        </Animated.View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.celebrateTitle} numberOfLines={2}>
            {title} is live
          </Text>
          <Text style={styles.celebrateBody}>It's at the top of your page. Share it!</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Dismiss" style={styles.celebrateClose}>
          <Text style={styles.celebrateCloseText}>✕</Text>
        </Pressable>
      </View>
      <Pressable onPress={onView} accessibilityRole="link" style={({ pressed }) => [styles.celebrateButton, pressed && { opacity: 0.85 }]}>
        <Text style={styles.celebrateButtonText}>View my page</Text>
      </Pressable>
    </Animated.View>
  );
}

function IconAction({ label, glyph, disabled, onPress, a11y }: { label: string; glyph: string; disabled: boolean; onPress: () => void; a11y: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.action, disabled && { opacity: 0.35 }, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.actionGlyph}>{glyph}</Text>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 56 },
  header: { gap: space.lg, marginBottom: space.md },
  greeting: { gap: space.md, marginTop: space.xs },
  hello: { ...type.display, fontSize: 30, lineHeight: 36, color: brand.plum },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 32, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: brand.white, ...shadow.card },
  chipLive: { backgroundColor: brand.pink, ...shadow.pink },
  chipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: brand.plum },
  chipText: { fontSize: 14, fontWeight: "600", color: brand.ink2 },
  chipNum: { fontWeight: "800", color: brand.plum },
  dock: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: "rgba(255,250,242,0.94)" },
  emptyArrow: { fontSize: 28, color: brand.pink, marginTop: space.sm },
  celebrate: { backgroundColor: brand.plum, borderRadius: radius.card, padding: space.lg, gap: space.md, ...shadow.float },
  celebrateRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  celebrateEmoji: { width: 48, height: 48, borderRadius: 24, backgroundColor: brand.sun, alignItems: "center", justifyContent: "center" },
  celebrateTitle: { color: brand.white, fontSize: 17, fontWeight: "800" },
  celebrateBody: { color: "rgba(255,255,255,0.75)", fontSize: 14, marginTop: 2 },
  celebrateClose: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  celebrateCloseText: { color: "rgba(255,255,255,0.7)", fontSize: 16, fontWeight: "700" },
  celebrateButton: { minHeight: 44, borderRadius: radius.pill, backgroundColor: brand.sun, alignItems: "center", justifyContent: "center" },
  celebrateButtonText: { color: brand.plum, fontWeight: "800", fontSize: 15 },
  headerButton: { paddingHorizontal: 4, paddingVertical: 6 },
  headerLink: { color: brand.blue, fontWeight: "700", fontSize: 16 },
  pageCard: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg + 2, borderRadius: radius.card, backgroundColor: brand.white, ...shadow.card },
  pageLabel: { ...type.section, color: brand.ok },
  pageUrl: { color: brand.plum, fontSize: 17, fontWeight: "800", marginTop: 4 },
  pageChevron: { color: brand.plum, fontSize: 30, lineHeight: 32, fontWeight: "300" },
  plus: { color: brand.plum, fontSize: 22, lineHeight: 24, fontWeight: "700" },
  empty: { alignItems: "center", padding: space.xxl, gap: space.sm },
  emptyTitle: { ...type.title, fontSize: 20, color: brand.plum },
  emptyBody: { ...type.body, color: brand.ink2, textAlign: "center" },
  card: { padding: space.md + 2, borderRadius: radius.card, backgroundColor: brand.white, borderWidth: 1, borderColor: "rgba(42,15,61,0.06)", gap: space.md, ...shadow.card },
  cardHidden: { backgroundColor: brand.paper2, borderStyle: "dashed", borderColor: brand.line, shadowOpacity: 0, elevation: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  thumb: { width: 64, height: 64, borderRadius: 14, overflow: "hidden", backgroundColor: brand.paper2, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontWeight: "800", fontSize: 16, lineHeight: 21, color: brand.plum },
  meta: { fontSize: 14, color: brand.ink2 },
  hiddenTag: { fontSize: 13, fontWeight: "700", color: brand.ink2, marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center", gap: space.sm, borderTopWidth: 1, borderTopColor: brand.line, paddingTop: space.md },
  action: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: brand.paper2 },
  actionGlyph: { fontSize: 16, fontWeight: "800", color: brand.plum },
  actionText: { fontSize: 14, fontWeight: "700", color: brand.plum },
  deleteAction: { backgroundColor: brand.dangerBg },
  deleteText: { fontSize: 14, fontWeight: "700", color: brand.danger },
});
