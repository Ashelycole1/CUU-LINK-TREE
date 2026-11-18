import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../src/auth/AuthContext";
import { WEB_HOST } from "../src/lib/api";
import { Icon, type IconName } from "../src/ui/Icon";
import { hashColour } from "../src/ui/kit";
import { corner, gap, usePalette } from "../src/ui/palette";

/** Seeded local accounts (npm run seed). Release builds start empty, so these only show in development. */
const DEMOS: { username: string; name: string; what: string; icon: IconName }[] = !__DEV__
  ? []
  : [
      { username: "buildersmeetup", name: "Builders Meetup", what: "Talks and hack weekends", icon: "code" },
      { username: "nightandsong", name: "Night & Song", what: "Live music, late nights", icon: "music" },
      { username: "sunrisesports", name: "Sunrise Sports Club", what: "Fun runs and finals", icon: "trophy" },
    ];

const STAGES: { icon: IconName; title: string; body: string }[] = [
  { icon: "calendar", title: "Announced", body: "Poster, date, tickets. One link to share." },
  { icon: "live", title: "Doors open", body: "A live countdown flips to Happening now." },
  { icon: "star", title: "Afterwards", body: "Photos and reviews land on the same page." },
];

/** Home: what Event Tree does, open any host's page, or manage your own. */
export default function HomeScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const open = () => {
    if (name.trim()) router.push(`/${name.trim().toLowerCase()}`);
  };

  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={[s.content, { paddingTop: insets.top + 12, paddingBottom: 40 + insets.bottom }]} keyboardShouldPersistTaps="handled">
      <View style={s.brandRow}>
        <View style={[s.mark, { backgroundColor: p.accent }]}>
          <Icon name="calendar" size={18} color={p.onAccent} strokeWidth={2.5} />
        </View>
        <Text style={{ color: p.text, fontSize: 18, fontWeight: "900" }}>Event Tree</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => router.push(user ? "/dashboard" : "/login")} hitSlop={8} accessibilityRole="button" style={[s.pill, { borderColor: p.borderStrong }]}>
          <Text style={{ color: p.text, fontWeight: "800", fontSize: 14 }}>{user ? "Your events" : "Log in"}</Text>
        </Pressable>
      </View>

      <Text style={[s.h1, { color: p.text }]}>
        Every event you host.{"\n"}
        <Text style={{ color: p.accentInk }}>One link.</Text>
      </Text>
      <Text style={{ color: p.textMuted, fontSize: 17, lineHeight: 24 }}>A page that follows each event from the announcement to the reviews.</Text>

      {/* Open any page */}
      <View style={[s.claim, { backgroundColor: p.surface }]}>
        <Text style={{ color: p.textSubtle, fontSize: 16, fontWeight: "600", maxWidth: "55%" }} numberOfLines={1}>
          {WEB_HOST}/
        </Text>
        <TextInput
          value={name}
          onChangeText={(t) => setName(t.replace(/\s/g, ""))}
          onSubmitEditing={open}
          placeholder="username"
          placeholderTextColor={p.textSubtle}
          selectionColor={p.accent}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          style={{ flex: 1, color: p.text, fontSize: 16, fontWeight: "800" }}
          accessibilityLabel="Page to open"
        />
        <Pressable
          onPress={open}
          disabled={!name.trim()}
          accessibilityRole="button"
          accessibilityLabel="Open page"
          style={[s.go, { backgroundColor: p.accent, opacity: name.trim() ? 1 : 0.4 }]}
        >
          <Icon name="chevronRight" size={20} color={p.onAccent} strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Community: what's on across every page. */}
      <Pressable
        onPress={() => router.push("/explore")}
        accessibilityRole="link"
        style={({ pressed }) => [s.community, { backgroundColor: p.bgElevated, borderColor: p.border, opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[s.stageIcon, { backgroundColor: p.accent }]}>
          <Icon name="search" size={20} color={p.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: p.text, fontSize: 16, fontWeight: "800" }}>See what's on</Text>
          <Text style={{ color: p.textMuted, fontSize: 14 }}>Upcoming events from every page, by category</Text>
        </View>
        <Icon name="chevronRight" size={20} color={p.textSubtle} />
      </Pressable>

      {/* One event, start to finish. */}
      <View style={{ gap: gap.md, marginTop: gap.lg }}>
        <Text style={[s.h2, { color: p.text }]}>One event, start to finish</Text>
        {STAGES.map((x, i) => (
          <View key={x.title} style={s.stage}>
            <View style={[s.stageIcon, { backgroundColor: i === 1 ? p.accent : p.surface }]}>
              <Icon name={x.icon} size={20} color={i === 1 ? p.onAccent : p.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: p.text, fontSize: 16, fontWeight: "800" }}>{x.title}</Text>
              <Text style={{ color: p.textMuted, fontSize: 14, lineHeight: 20 }}>{x.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {DEMOS.length > 0 && (
        <View style={{ gap: gap.md, marginTop: gap.lg }}>
          <Text style={[s.h2, { color: p.text }]}>Example pages</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {DEMOS.map((d) => (
              <Pressable key={d.username} onPress={() => router.push(`/${d.username}`)} accessibilityRole="link" style={{ width: 148, gap: 6 }}>
                <View style={[s.demoArt, { backgroundColor: hashColour(d.name) }]}>
                  <Icon name={d.icon} size={52} color="#ffffff" />
                </View>
                <Text style={{ color: p.text, fontWeight: "800", fontSize: 15 }} numberOfLines={1}>
                  {d.name}
                </Text>
                <Text style={{ color: p.textSubtle, fontSize: 13 }} numberOfLines={2}>
                  {d.what}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <Pressable
        onPress={() => router.push(user ? "/dashboard" : "/login")}
        accessibilityRole="button"
        style={({ pressed }) => [s.cta, { backgroundColor: p.accent, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
      >
        <Text style={{ color: p.onAccent, fontWeight: "800", fontSize: 17 }}>{user ? `Manage @${user.username}` : "Get your free page"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: gap.lg, gap: gap.xl },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: { width: 32, height: 32, borderRadius: corner.md, alignItems: "center", justifyContent: "center" },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: corner.pill, borderWidth: 1 },
  h1: { fontSize: 46, lineHeight: 48, fontWeight: "900", letterSpacing: -2, marginTop: gap.xl },
  h2: { fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },
  claim: { flexDirection: "row", alignItems: "center", height: 60, paddingLeft: 16, paddingRight: 6, borderRadius: corner.pill },
  go: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  stage: { flexDirection: "row", alignItems: "center", gap: 14 },
  community: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: corner.lg, borderWidth: 1 },
  stageIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  demoArt: { width: 148, height: 148, borderRadius: corner.md, alignItems: "center", justifyContent: "center" },
  cta: { height: 56, borderRadius: corner.pill, alignItems: "center", justifyContent: "center", marginTop: gap.md },
});
