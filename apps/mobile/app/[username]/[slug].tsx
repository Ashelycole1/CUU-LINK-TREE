import { useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { EventDTO } from "@event-tree/api-client";
import { Gallery } from "../../src/components/Gallery";
import { ReviewSection, Stars } from "../../src/components/ReviewSection";
import { api, webUrl } from "../../src/lib/api";
import { useResource } from "../../src/lib/useResource";
import { dayNumber, headerTint, monthShort, startsIn, timeShort, weekdayShort, whenLine } from "../../src/ui/dates";
import { Countdown, PhaseRail } from "../../src/ui/EventFlow";
import { Icon, LINK_ICONS, categoryIcon } from "../../src/ui/Icon";
import { CoverArt, hashColour } from "../../src/ui/kit";
import { corner, gap, usePalette } from "../../src/ui/palette";

const KIND = { upcoming: "Upcoming event", live: "Happening now", past: "Past event" } as const;

/**
 * One event, arranged by where it is in its life. Before: countdown, the
 * main button, details first. During: time left and the main button. After:
 * the score and reviews first, then photos, then details.
 */
export default function EventScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { username = "", slug = "" } = useLocalSearchParams<{ username: string; slug: string }>();
  const page = useResource(() => api.getPage(username), [username]);
  const event = useResource(() => api.getPageEvent(username, slug), [username, slug]);
  const scroll = useRef<ScrollViewInstance>(null);
  const [reviewsY, setReviewsY] = useState(0);
  const [heroH, setHeroH] = useState(0);
  const e = event.data;
  const profile = page.data?.profile;
  const tint = headerTint(profile?.appearance.colors.background ?? "#5b4b8a", p);

  const chrome = (
    <View style={[s.chromeBar, { top: insets.top + 6 }]} pointerEvents="box-none">
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace(`/${username}`))}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={s.chrome}
      >
        <View style={{ transform: [{ rotate: "180deg" }] }}>
          <Icon name="chevronRight" size={20} color="#ffffff" />
        </View>
      </Pressable>
      {e && (
        <Pressable
          onPress={() => void Share.share({ message: `${e.title}, ${whenLine(e.startsAt)}\n${webUrl(username, e.slug)}` })}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Share this event"
          style={s.chrome}
        >
          <Icon name="share" size={18} color="#ffffff" />
        </Pressable>
      )}
    </View>
  );

  if (!e) {
    return (
      <View style={[s.center, { backgroundColor: p.bg }]}>
        <StatusBar style="light" />
        {chrome}
        {event.error ? <Text style={{ color: p.danger, fontSize: 16, textAlign: "center" }}>{event.error.message}</Text> : <ActivityIndicator color={p.text} />}
      </View>
    );
  }

  const links = [...e.links].sort((a, b) => Number(b.primary) - Number(a.primary));
  const main = e.status !== "past" ? links[0] : undefined;
  const others = main ? links.slice(1) : links;
  const more = (page.data?.upcoming ?? []).filter((x) => x.id !== e.id).slice(0, 8);
  const hostName = profile?.displayName ?? username;

  const details = (
    <Section key="details" title="Details">
      <View style={[s.facts, { backgroundColor: p.bgElevated, borderColor: p.border }]}>
        {[
          { icon: "calendar" as const, label: whenLine(e.startsAt), sub: `Until ${timeShort(e.endsAt)}` },
          { icon: "pin" as const, label: e.venue, sub: null },
          { icon: "user" as const, label: e.organizer, sub: "Organiser" },
          { icon: categoryIcon(e.category), label: e.category, sub: null },
        ]
          .filter((f) => !!f.label)
          .map((f, i) => (
            <View key={f.icon + i} style={[s.fact, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.border }]}>
              <Icon name={f.icon} size={18} color={p.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: p.text, fontSize: 15, fontWeight: "600" }}>{f.label}</Text>
                {!!f.sub && <Text style={{ color: p.textSubtle, fontSize: 13 }}>{f.sub}</Text>}
              </View>
            </View>
          ))}
      </View>
      {!!e.description && <Text style={{ color: p.textMuted, fontSize: 16, lineHeight: 24 }}>{e.description}</Text>}
    </Section>
  );
  const photos = (
    <Section key="photos" title="Photos" count={e.gallery.length}>
      <Gallery event={e} onUpdated={event.set} />
    </Section>
  );
  const reviews = (
    <View key="reviews" onLayout={(ev) => setReviewsY(ev.nativeEvent.layout.y)}>
      <Section title="Reviews" count={e.rating.count}>
        <ReviewSection event={e} onChanged={event.reload} />
      </Section>
    </View>
  );
  const sections = e.status === "upcoming" ? [details, photos, reviews] : [reviews, photos, details];

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <StatusBar style="light" />
      <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        {/* Hero: the poster on the host's colour. */}
        <View style={[s.hero, { backgroundColor: tint, paddingTop: insets.top + 56 }]} onLayout={(ev) => setHeroH(ev.nativeEvent.layout.height)}>
          <View style={s.poster}>
            {e.coverImage ? (
              <Image source={{ uri: e.coverImage.url }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={e.coverImage.alt} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: hashColour(e.title), alignItems: "center", justifyContent: "center" }]}>
                <Icon name={categoryIcon(e.category)} size={88} color="#ffffff" />
              </View>
            )}
          </View>
        </View>

        <View style={s.body}>
          <View style={{ gap: 8 }}>
            <Text style={{ color: e.status === "live" ? p.accentInk : p.textSubtle, fontSize: 13, fontWeight: "800" }}>
              {KIND[e.status]}
              {e.category ? ` · ${e.category}` : ""}
            </Text>
            <Text style={[s.title, { color: p.text }]} accessibilityRole="header">
              {e.title}
            </Text>
            <Pressable onPress={() => router.push(`/${username}`)} accessibilityRole="link" style={s.hostRow} hitSlop={6}>
              <View style={[s.hostArt, { backgroundColor: hashColour(hostName) }]}>
                {profile?.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={StyleSheet.absoluteFill} /> : <Icon name="user" size={14} color="#fff" />}
              </View>
              <Text style={{ color: p.text, fontWeight: "700", fontSize: 14 }}>{hostName}</Text>
            </Pressable>
          </View>

          {/* Calendar leaf + time and place. */}
          <View style={s.when}>
            <View style={[s.leaf, { backgroundColor: p.bgElevated, borderColor: p.border }]}>
              <View style={[s.leafTop, { backgroundColor: p.accent }]}>
                <Text style={{ color: p.onAccent, fontSize: 11, fontWeight: "900" }}>{monthShort(e.startsAt).toUpperCase()}</Text>
              </View>
              <Text style={{ color: p.text, fontSize: 24, fontWeight: "900", fontVariant: ["tabular-nums"] }}>{dayNumber(e.startsAt)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: p.text, fontSize: 16, fontWeight: "800" }}>
                {weekdayShort(e.startsAt)}, {timeShort(e.startsAt)} – {timeShort(e.endsAt)}
              </Text>
              <Text style={{ color: p.textSubtle, fontSize: 14, marginTop: 2 }} numberOfLines={2}>
                {e.venue || startsIn(e.startsAt, e.endsAt)}
              </Text>
            </View>
          </View>

          <PhaseRail event={e} />

          {/* What matters right now. */}
          <View style={[s.now, { backgroundColor: p.bgElevated, borderColor: e.status === "live" ? p.accent : p.border }]}>
            {e.status === "past" ? (
              <View style={s.score}>
                <Text style={{ color: p.text, fontSize: 44, fontWeight: "900", fontVariant: ["tabular-nums"] }}>
                  {e.rating.count ? e.rating.average.toFixed(1) : "–"}
                </Text>
                <View style={{ gap: 4 }}>
                  <Stars value={e.rating.average} size={18} />
                  <Text style={{ color: p.textSubtle, fontSize: 13 }}>
                    {e.rating.count ? `${e.rating.count} review${e.rating.count === 1 ? "" : "s"}` : "No reviews yet. Were you there?"}
                  </Text>
                </View>
              </View>
            ) : (
              <Countdown event={e} />
            )}
            {others.length > 0 && (
              <View style={{ gap: 4 }}>
                {others.map((l) => (
                  <Pressable
                    key={l.url + l.label}
                    onPress={() => void Linking.openURL(l.url)}
                    accessibilityRole="link"
                    accessibilityLabel={l.label}
                    style={({ pressed }) => [s.linkRow, { backgroundColor: pressed ? p.surface : "transparent" }]}
                  >
                    <View style={[s.linkIcon, { backgroundColor: p.surface }]}>
                      <Icon name={LINK_ICONS[l.kind]} size={18} color={p.text} />
                    </View>
                    <Text style={{ flex: 1, color: p.text, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>
                      {l.label}
                    </Text>
                    <Icon name="external" size={16} color={p.textSubtle} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {sections}

          {more.length > 0 && (
            <Section title={`More from ${hostName}`}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {more.map((x: EventDTO) => (
                  <Pressable key={x.id} onPress={() => router.push(`/${username}/${x.slug}`)} accessibilityRole="link" style={{ width: 140, gap: 6 }}>
                    <CoverArt uri={x.coverImage?.url} name={x.title} category={x.category} size={140} />
                    <Text style={{ color: p.text, fontWeight: "700", fontSize: 14 }} numberOfLines={2}>
                      {x.title}
                    </Text>
                    <Text style={{ color: p.textSubtle, fontSize: 12 }}>
                      {weekdayShort(x.startsAt)} {dayNumber(x.startsAt)} {monthShort(x.startsAt)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Section>
          )}
        </View>
      </ScrollView>

      {chrome}

      {/* The one thing to do now, in thumb reach. */}
      <View style={[s.bar, { backgroundColor: p.bg, borderTopColor: p.border, paddingBottom: 12 + insets.bottom }]}>
        {main ? (
          <Pressable
            onPress={() => void Linking.openURL(main.url)}
            accessibilityRole="link"
            style={({ pressed }) => [s.cta, { backgroundColor: p.accent, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <Icon name={LINK_ICONS[main.kind]} size={20} color={p.onAccent} />
            <Text style={{ color: p.onAccent, fontWeight: "800", fontSize: 17 }} numberOfLines={1}>
              {main.label}
            </Text>
          </Pressable>
        ) : e.status === "past" ? (
          <Pressable
            onPress={() => scroll.current?.scrollTo({ y: heroH + reviewsY, animated: true })}
            accessibilityRole="button"
            style={({ pressed }) => [s.cta, { backgroundColor: p.accent, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <Icon name="star" size={20} color={p.onAccent} />
            <Text style={{ color: p.onAccent, fontWeight: "800", fontSize: 17 }}>Rate this event</Text>
          </Pressable>
        ) : (
          <View style={[s.cta, { backgroundColor: p.surface }]}>
            <Text style={{ color: p.text, fontWeight: "800", fontSize: 16 }}>{startsIn(e.startsAt, e.endsAt)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ gap: gap.md }}>
      <Text style={{ color: p.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.4 }} accessibilityRole="header">
        {title}
        {!!count && <Text style={{ color: p.textSubtle, fontWeight: "700" }}> {count}</Text>}
      </Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: gap.xl },
  chromeBar: { position: "absolute", left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
  chrome: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  hero: { alignItems: "center", paddingBottom: gap.xl, paddingHorizontal: gap.xl },
  poster: { width: "78%", aspectRatio: 1, borderRadius: corner.md, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  body: { padding: gap.lg, gap: gap.xl },
  title: { fontSize: 34, lineHeight: 38, fontWeight: "900", letterSpacing: -1 },
  hostRow: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" },
  hostArt: { width: 24, height: 24, borderRadius: 12, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  when: { flexDirection: "row", alignItems: "center", gap: 14 },
  leaf: { width: 56, borderRadius: corner.md, borderWidth: 1, overflow: "hidden", alignItems: "center", paddingBottom: 4 },
  leafTop: { alignSelf: "stretch", alignItems: "center", paddingVertical: 2, marginBottom: 2 },
  now: { gap: 16, padding: 16, borderRadius: corner.lg, borderWidth: 1.5 },
  score: { flexDirection: "row", alignItems: "center", gap: 16 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, paddingHorizontal: 4, borderRadius: corner.md },
  linkIcon: { width: 36, height: 36, borderRadius: corner.sm, alignItems: "center", justifyContent: "center" },
  facts: { borderRadius: corner.lg, borderWidth: 1, paddingHorizontal: 14 },
  fact: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: gap.lg, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  cta: { height: 54, borderRadius: corner.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 20 },
});
