import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { EventDTO } from "@event-tree/api-client";
import { api, webUrl } from "../../src/lib/api";
import { useResource } from "../../src/lib/useResource";
import { dayNumber, headerTint, monthShort, startsIn, timeShort, weekdayShort } from "../../src/ui/dates";
import { Icon, SOCIAL_ICONS } from "../../src/ui/Icon";
import { CoverArt, hashColour } from "../../src/ui/kit";
import { corner, gap, usePalette } from "../../src/ui/palette";

/**
 * A host's page, laid out like an album: tinted header with the host's art
 * and name, a play button that opens the next event, then Upcoming and Past
 * as a dated track list.
 */
export default function HostScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { username = "" } = useLocalSearchParams<{ username: string }>();
  const page = useResource(() => api.getPage(username), [username]);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    if (page.data) void api.recordView(username).catch(() => undefined);
  }, [page.data?.profile.ownerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (event: EventDTO) => {
    void api.recordClick(event.id).catch(() => undefined);
    router.push(`/${username}/${event.slug}`);
  };

  const profile = page.data?.profile;
  const upcoming = page.data?.upcoming ?? [];
  const past = page.data?.past ?? [];
  const next = upcoming.find((e) => e.status === "live") ?? upcoming[0];
  const list = tab === "upcoming" ? upcoming : past;
  const tint = headerTint(profile?.appearance.colors.background ?? "#5b4b8a", p);
  const onTint = p.scheme === "dark" ? "rgba(255,255,255,0.8)" : "rgba(18,18,18,0.72)";
  // The header image fills the header; the art shows the profile picture.
  const cover = profile?.heroImageUrl && profile.avatarUrl ? profile.heroImageUrl : "";
  const photo = profile?.avatarUrl || profile?.heroImageUrl;
  const name = profile?.displayName ?? username;
  const initials = name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (page.error?.isNotFound) {
    return (
      <View style={[s.center, { backgroundColor: p.bg, paddingTop: insets.top }]}>
        <Text style={{ color: p.text, fontSize: 24, fontWeight: "900" }}>Nothing here</Text>
        <Text style={{ color: p.textMuted, fontSize: 15, textAlign: "center" }}>No one has claimed /{username} yet.</Text>
        <Pressable onPress={() => router.replace("/")} style={[s.ghost, { borderColor: p.borderStrong }]} accessibilityRole="button">
          <Text style={{ color: p.text, fontWeight: "800" }}>Go home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <StatusBar style={p.scheme === "dark" ? "light" : "dark"} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={page.reload} tintColor={p.text} />}
      >
        {/* Album header, tinted with the host's colour. */}
        <View style={[s.header, { backgroundColor: tint, paddingTop: insets.top + 8 }]}>
          {!!cover && (
            <>
              <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
              {/* Fade the photo into the page so the name stays readable. */}
              <View style={[StyleSheet.absoluteFill, { backgroundColor: tint, opacity: 0.45 }]} />
              <View style={[s.fade, { backgroundColor: p.bg }]} />
            </>
          )}
          <View style={s.topBar}>
            {router.canGoBack() ? (
              <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={[s.chrome, { backgroundColor: "rgba(0,0,0,0.25)" }]}>
                <View style={{ transform: [{ rotate: "180deg" }] }}>
                  <Icon name="chevronRight" size={20} color="#ffffff" />
                </View>
              </Pressable>
            ) : (
              <View />
            )}
          </View>
          <View style={[s.art, { backgroundColor: hashColour(name) }]}>
            {photo ? (
              <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
            ) : (
              <Text style={s.initials}>{initials}</Text>
            )}
          </View>
          <Text style={[s.kicker, { color: onTint }]}>Event page</Text>
          <Text style={[s.name, { color: p.text }]} accessibilityRole="header" numberOfLines={3} adjustsFontSizeToFit>
            {profile ? name : " "}
          </Text>
          {!!profile?.bio && (
            <Text style={[s.bio, { color: onTint }]} numberOfLines={4}>
              {profile.bio}
            </Text>
          )}
          <Text style={[s.meta, { color: onTint }]}>
            <Text style={{ fontWeight: "800", color: p.text }}>@{username}</Text> · {upcoming.length} upcoming · {past.length} past
          </Text>
        </View>

        <View style={s.body}>
          {/* Actions: play opens the next event. */}
          <View style={s.actions}>
            <Pressable
              onPress={() => next && open(next)}
              disabled={!next}
              accessibilityRole="button"
              accessibilityLabel={next ? `Open the next event, ${next.title}` : "No upcoming events"}
              style={({ pressed }) => [s.play, { backgroundColor: p.accent, opacity: next ? 1 : 0.4, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
            >
              <Icon name="play" size={24} color={p.onAccent} fill={p.onAccent} />
            </Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              {next ? (
                <>
                  <Text style={{ color: next.status === "live" ? p.accentInk : p.textSubtle, fontSize: 12, fontWeight: "800" }}>
                    {next.status === "live" ? "Happening now" : "Next up"}
                  </Text>
                  <Text style={{ color: p.text, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>
                    {next.title}
                  </Text>
                  <Text style={{ color: p.textSubtle, fontSize: 13 }} numberOfLines={1}>
                    {startsIn(next.startsAt, next.endsAt)}
                  </Text>
                </>
              ) : (
                <Text style={{ color: p.textSubtle, fontSize: 14 }}>{page.loading ? " " : "Nothing coming up yet"}</Text>
              )}
            </View>
            <Pressable
              onPress={() => void Share.share({ message: `${name} on Event Tree\n${webUrl(username)}` })}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Share this page"
              style={[s.iconBtn, { borderColor: p.borderStrong }]}
            >
              <Icon name="share" size={18} color={p.text} />
            </Pressable>
          </View>

          {!!profile?.socials.length && (
            <View style={s.socials}>
              {profile.socials.map((x) => (
                <Pressable
                  key={x.platform}
                  onPress={() => void Linking.openURL(x.url)}
                  accessibilityRole="link"
                  accessibilityLabel={x.platform}
                  hitSlop={4}
                  style={({ pressed }) => [s.iconBtn, { borderColor: p.border, backgroundColor: pressed ? p.surface : "transparent" }]}
                >
                  <Icon name={SOCIAL_ICONS[x.platform]} size={18} color={p.textMuted} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Upcoming / Past */}
          <View style={s.tabs} accessibilityRole="tablist">
            {(["upcoming", "past"] as const).map((t) => {
              const on = tab === t;
              const count = t === "upcoming" ? upcoming.length : past.length;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={[s.tab, { backgroundColor: on ? p.text : p.surface }]}
                >
                  <Text style={{ color: on ? p.bg : p.text, fontWeight: "700", fontSize: 14 }}>
                    {t === "upcoming" ? "Upcoming" : "Past"} {count > 0 ? count : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {page.loading && !page.data && <ActivityIndicator color={p.text} style={{ marginTop: 24 }} />}
          {!!page.error && !page.error.isNotFound && <Text style={{ color: p.danger, textAlign: "center" }}>{page.error.message}</Text>}
          {page.data && list.length === 0 && (
            <Text style={{ color: p.textSubtle, textAlign: "center", paddingVertical: 24, fontSize: 15 }}>
              {tab === "upcoming" ? "Nothing coming up. Check back soon." : "No past events yet."}
            </Text>
          )}

          {list.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => open(e)}
              accessibilityRole="link"
              accessibilityLabel={`${e.title}, ${weekdayShort(e.startsAt)} ${dayNumber(e.startsAt)} ${monthShort(e.startsAt)}${e.status === "live" ? ", happening now" : ""}`}
              style={({ pressed }) => [s.track, { backgroundColor: pressed ? p.surface : "transparent" }]}
            >
              <View style={s.date}>
                <Text style={{ color: e.status === "live" ? p.accentInk : p.textSubtle, fontSize: 11, fontWeight: "800" }}>{monthShort(e.startsAt).toUpperCase()}</Text>
                <Text style={{ color: p.text, fontSize: 22, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{dayNumber(e.startsAt)}</Text>
              </View>
              <View style={{ opacity: tab === "past" ? 0.75 : 1 }}>
                <CoverArt uri={e.coverImage?.url} name={e.title} category={e.category} size={52} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: p.text, fontSize: 16, fontWeight: "700" }} numberOfLines={1}>
                  {e.title}
                </Text>
                <Text style={{ color: p.textSubtle, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                  {e.status === "live" ? <Text style={{ color: p.accentInk, fontWeight: "800" }}>Live now · </Text> : null}
                  {weekdayShort(e.startsAt)} {timeShort(e.startsAt)}
                  {e.venue ? ` · ${e.venue}` : ""}
                </Text>
              </View>
              {tab === "past" && e.rating.count > 0 && (
                <View style={s.rating}>
                  <Icon name="star" size={13} color={p.accentInk} fill={p.accentInk} />
                  <Text style={{ color: p.textMuted, fontSize: 13, fontWeight: "700" }}>{e.rating.average.toFixed(1)}</Text>
                </View>
              )}
            </Pressable>
          ))}

          <Pressable onPress={() => router.push("/")} style={s.footer} accessibilityRole="link">
            <Text style={{ color: p.textSubtle, fontSize: 13, fontWeight: "700" }}>Made with Event Tree</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  ghost: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: corner.pill, borderWidth: 1.5 },
  header: { paddingHorizontal: gap.lg, paddingBottom: gap.xl, gap: 6, overflow: "hidden" },
  fade: { position: "absolute", left: 0, right: 0, bottom: 0, height: "45%", opacity: 0.85 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: gap.lg },
  chrome: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  art: { width: 168, height: 168, borderRadius: corner.md, overflow: "hidden", alignItems: "center", justifyContent: "center", marginBottom: gap.lg, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  initials: { color: "#ffffff", fontSize: 56, fontWeight: "900" },
  kicker: { fontSize: 13, fontWeight: "700" },
  name: { fontSize: 44, lineHeight: 48, fontWeight: "900", letterSpacing: -1.5 },
  bio: { fontSize: 15, lineHeight: 21, marginTop: 4 },
  meta: { fontSize: 13, marginTop: 6 },
  body: { paddingHorizontal: gap.lg, paddingTop: gap.lg, gap: gap.lg },
  actions: { flexDirection: "row", alignItems: "center", gap: 14 },
  play: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", paddingLeft: 3 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  socials: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tabs: { flexDirection: "row", gap: 8, marginTop: 4 },
  tab: { height: 36, paddingHorizontal: 16, borderRadius: corner.pill, justifyContent: "center" },
  track: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, paddingHorizontal: 6, marginHorizontal: -6, borderRadius: corner.md },
  date: { width: 38, alignItems: "center" },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  footer: { alignSelf: "center", paddingVertical: 12, marginTop: gap.xl },
});
