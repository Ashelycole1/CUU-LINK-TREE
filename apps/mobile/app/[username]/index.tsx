import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { EventDTO, SocialLinkDTO } from "@event-tree/api-client";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinkButton } from "../../src/components/LinkButton";
import { api } from "../../src/lib/api";
import { useResource } from "../../src/lib/useResource";
import { DEFAULT_THEME, ThemeContext, isDark, tokens } from "../../src/theme";

const SOCIAL_LABELS: Record<SocialLinkDTO["platform"], string> = {
  instagram: "IG",
  x: "X",
  linkedin: "in",
  whatsapp: "WA",
  youtube: "YT",
  tiktok: "TT",
  facebook: "f",
  website: "🌐",
};

/** A host page at /:username, laid out like Linktree: avatar, name, bio, socials, then one button per event. */
export default function TreeScreen() {
  const { username = "" } = useLocalSearchParams<{ username: string }>();
  const [showPast, setShowPast] = useState(false);

  const page = useResource(() => api.getPage(username), [username]);
  const theme = page.data?.profile.appearance.colors ?? DEFAULT_THEME;
  const buttonStyle = page.data?.profile.appearance.buttonStyle ?? "pill";

  useEffect(() => {
    if (page.data) void api.recordView(username).catch(() => undefined);
  }, [page.data?.profile.ownerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (event: EventDTO) => {
    void api.recordClick(event.id).catch(() => undefined);
    router.push(`/${username}/${event.slug}`);
  };

  const upcoming = page.data?.upcoming ?? [];
  const past = page.data?.past ?? [];
  const p = page.data?.profile;
  const photo = p?.avatarUrl || p?.heroImageUrl;
  const initials = (p?.displayName ?? "")
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const muted = isDark(theme.background) ? tokens.muted : "rgba(0,0,0,0.6)";

  if (page.error?.isNotFound) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.name, { color: theme.text }]}>Nothing here</Text>
        <Text style={[styles.bio, { color: theme.text }]}>There is no Event Tree at /{username} yet.</Text>
        <Pressable onPress={() => router.replace("/")} style={[styles.footer, { borderColor: muted }]} accessibilityRole="button">
          <Text style={[styles.footerText, { color: theme.text }]}>Go home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const eventButton = (e: EventDTO, dimmed = false) => (
    <LinkButton
      key={e.id}
      label={e.title}
      variant={buttonStyle}
      dimmed={dimmed}
      onPress={() => open(e)}
      accessibilityLabel={`${e.title}, ${new Date(e.startsAt).toDateString()}`}
      leading={e.status === "live" ? <View style={[styles.liveDot, { backgroundColor: tokens.live }]} /> : undefined}
    />
  );

  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar style={isDark(theme.background) ? "light" : "dark"} />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={false} onRefresh={page.reload} tintColor={theme.text} />}
        >
          <View style={styles.column}>
            <View style={[styles.avatar, { backgroundColor: theme.card }]}>
              {photo ? (
                <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <Text style={[styles.avatarText, { color: theme.cardText }]}>{initials}</Text>
              )}
            </View>
            <Text style={[styles.name, { color: theme.text }]}>{p?.displayName ?? " "}</Text>
            <Text style={[styles.handle, { color: muted }]}>@{username}</Text>
            {!!p?.bio && <Text style={[styles.bio, { color: theme.text }]}>{p.bio}</Text>}

            {!!p?.socials.length && (
              <View style={styles.socials}>
                {p.socials.map((s) => (
                  <Pressable
                    key={s.platform}
                    onPress={() => void Linking.openURL(s.url)}
                    accessibilityRole="link"
                    accessibilityLabel={s.platform}
                    hitSlop={6}
                    style={({ pressed }) => [styles.social, { borderColor: theme.text, opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Text style={[styles.socialText, { color: theme.text }]}>{SOCIAL_LABELS[s.platform]}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.links}>
              {page.loading && !page.data && <ActivityIndicator color={theme.text} style={{ marginTop: 24 }} />}
              {!!page.error && <Text style={styles.error}>{page.error.message}</Text>}

              {upcoming.map((e) => eventButton(e))}
              {page.data && upcoming.length === 0 && (
                <Text style={[styles.empty, { color: muted }]}>No upcoming events yet.</Text>
              )}

              {past.length > 0 && (
                <>
                  <Pressable
                    onPress={() => setShowPast((v) => !v)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: showPast }}
                    style={styles.pastToggle}
                  >
                    <Text style={[styles.pastToggleText, { color: theme.text }]}>
                      {showPast ? "Hide past events" : `Past events (${past.length})`}  {showPast ? "▴" : "▾"}
                    </Text>
                  </Pressable>
                  {showPast && past.map((e) => eventButton(e, true))}
                </>
              )}
            </View>

            <Pressable onPress={() => router.push("/")} style={[styles.footer, { borderColor: muted }]} accessibilityRole="link">
              <Text style={[styles.footerText, { color: theme.text }]}>Event Tree</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  content: { paddingHorizontal: tokens.gutter, paddingTop: 40, paddingBottom: 48 },
  column: { width: "100%", maxWidth: 580, alignSelf: "center", alignItems: "center" },
  avatar: { width: 96, height: 96, borderRadius: 48, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 32, fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "700", textAlign: "center", marginTop: 16 },
  handle: { fontSize: 14, textAlign: "center", marginTop: 2 },
  bio: { fontSize: 15, textAlign: "center", marginTop: 10, lineHeight: 22, paddingHorizontal: 8 },
  socials: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 18 },
  social: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  socialText: { fontSize: 14, fontWeight: "700" },
  links: { alignSelf: "stretch", marginTop: 32 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { textAlign: "center", paddingVertical: 16 },
  error: { color: tokens.danger, textAlign: "center", marginBottom: 12 },
  pastToggle: { alignSelf: "center", paddingVertical: 12, paddingHorizontal: 16, marginTop: 4, marginBottom: 10 },
  pastToggleText: { fontSize: 15, fontWeight: "600" },
  footer: { marginTop: 36, paddingVertical: 8, paddingHorizontal: 16, borderRadius: tokens.radiusPill, borderWidth: 1 },
  footerText: { fontSize: 13, fontWeight: "700" },
});
