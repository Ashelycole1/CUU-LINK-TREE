import { useCallback, useState } from "react";
import { Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from "react-native";
import { Redirect, Stack, router, useFocusEffect } from "expo-router";
import { ApiError, Format, type EventDTO } from "@event-tree/api-client";
import { useAuth } from "../../src/auth/AuthContext";
import { api } from "../../src/lib/api";
import { useResource } from "../../src/lib/useResource";
import { brand } from "../../src/theme";

/** The host's events: show/hide, reorder, delete, add. The phone version of the web dashboard. */
export default function DashboardScreen() {
  const { identity, user, checking, logout } = useAuth();
  const events = useResource(() => (user ? api.listMyEvents() : Promise.resolve([])), [user?.id]);
  const [notice, setNotice] = useState<string | null>(null);

  // Reload when coming back from the add-event screen.
  useFocusEffect(
    useCallback(() => {
      void events.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (checking) return null;
  if (!identity) return <Redirect href="/login" />;
  if (!user) return <Redirect href="/claim" />;
  const list = events.data ?? [];

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      await events.reload();
      setNotice(message);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "That didn't work. Try again.");
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

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => {
                void logout().then(() => router.replace("/"));
              }}
              hitSlop={10}
              accessibilityRole="button"
            >
              <Text style={styles.headerLink}>Log out</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={events.reload} />}
        ListHeaderComponent={
          <View style={{ gap: 10, marginBottom: 14 }}>
            <Pressable onPress={() => router.push(`/${user.username}`)} style={styles.live} accessibilityRole="link">
              <View style={styles.liveDot} />
              <Text style={styles.liveText} numberOfLines={1}>
                Your page: /{user.username}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push("/dashboard/new")} style={styles.add} accessibilityRole="button">
              <Text style={styles.addText}>+ Add event</Text>
            </Pressable>
            {!!notice && <Text style={styles.notice}>{notice}</Text>}
          </View>
        }
        ListEmptyComponent={events.loading ? undefined : <Text style={styles.empty}>No events yet. Add your first one.</Text>}
        renderItem={({ item, index }) => (
          <View style={[styles.card, item.hidden && { backgroundColor: brand.paper2 }]}>
            <View style={styles.reorder}>
              <Pressable onPress={() => move(index, -1)} disabled={index === 0} hitSlop={6} accessibilityLabel={`Move ${item.title} up`}>
                <Text style={[styles.arrow, index === 0 && styles.disabled]}>▲</Text>
              </Pressable>
              <Pressable onPress={() => move(index, 1)} disabled={index === list.length - 1} hitSlop={6} accessibilityLabel={`Move ${item.title} down`}>
                <Text style={[styles.arrow, index === list.length - 1 && styles.disabled]}>▼</Text>
              </Pressable>
            </View>
            <View style={[styles.thumb, item.hidden && { opacity: 0.5 }]}>
              {item.coverImage ? <Image source={{ uri: item.coverImage.url }} style={StyleSheet.absoluteFill} /> : <Text style={{ fontSize: 22 }}>{item.emoji}</Text>}
            </View>
            <View style={[styles.body, item.hidden && { opacity: 0.5 }]}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {Format.dateRange(item.startsAt, item.endsAt)}
              </Text>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={6} accessibilityRole="button">
                <Text style={styles.delete}>Delete</Text>
              </Pressable>
            </View>
            <Switch
              value={!item.hidden}
              onValueChange={() => void run(() => api.updateEvent(item.id, { hidden: !item.hidden }), item.hidden ? "Shown on your page" : "Hidden from your page")}
              trackColor={{ true: brand.ok, false: "#cfc2b0" }}
              accessibilityLabel={`Show ${item.title} on your page`}
            />
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  headerLink: { color: brand.blue, fontWeight: "700" },
  live: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 16, backgroundColor: "#e8edff" },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: brand.ok },
  liveText: { flex: 1, fontWeight: "700", color: "#2440d6" },
  add: { minHeight: 54, borderRadius: 64, backgroundColor: brand.blue, alignItems: "center", justifyContent: "center" },
  addText: { color: "#fff", fontWeight: "800", fontSize: 17 },
  notice: { color: brand.ok, fontWeight: "600" },
  empty: { textAlign: "center", color: brand.ink2, padding: 32 },
  card: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, paddingLeft: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: brand.line, marginBottom: 10 },
  reorder: { gap: 8 },
  arrow: { fontSize: 12, color: brand.ink2, paddingHorizontal: 4 },
  disabled: { opacity: 0.2 },
  thumb: { width: 50, height: 50, borderRadius: 12, overflow: "hidden", backgroundColor: brand.paper2, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, minWidth: 0 },
  title: { fontWeight: "700", fontSize: 16, color: brand.plum },
  meta: { fontSize: 13, color: brand.ink2 },
  delete: { color: brand.danger, fontWeight: "700", fontSize: 13, marginTop: 4 },
});
