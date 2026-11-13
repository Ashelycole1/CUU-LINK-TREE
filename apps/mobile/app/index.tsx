import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/auth/AuthContext";
import { WEB_HOST } from "../src/lib/api";
import { brand } from "../src/theme";

/** Seeded local accounts (npm run seed). Release builds start empty, so these only show in development. */
const DEMOS = !__DEV__ ? [] : [
  { username: "buildersmeetup", name: "Builders Meetup", what: "Talks, hack weekends, career nights", bg: brand.blue, fg: "#ffffff" },
  { username: "nightandsong", name: "Night & Song", what: "Live music and late-night culture", bg: brand.plum, fg: brand.paper },
  { username: "sunrisesports", name: "Sunrise Sports Club", what: "Fun runs and finals days", bg: brand.pink, fg: brand.plum },
];

/** Home: open any host's page by name, or manage your own. */
export default function HomeScreen() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const open = () => {
    if (name.trim()) router.push(`/${name.trim().toLowerCase()}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🎟 Event Tree</Text>
        <Text style={styles.title}>One link for every event you host.</Text>

        <View style={styles.claim}>
          <Text style={styles.host} numberOfLines={1}>{WEB_HOST}/</Text>
          <TextInput
            value={name}
            onChangeText={(t) => setName(t.replace(/\s/g, ""))}
            onSubmitEditing={open}
            placeholder="username"
            placeholderTextColor="#9a8ca6"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            style={styles.input}
            accessibilityLabel="Page to open"
          />
        </View>
        <Pressable onPress={open} style={[styles.button, { backgroundColor: brand.pink }]} accessibilityRole="button">
          <Text style={[styles.buttonText, { color: brand.plum }]}>Open page</Text>
        </Pressable>

        {DEMOS.length > 0 && <Text style={styles.head}>Local demo pages</Text>}
        {DEMOS.map((d) => (
          <Pressable key={d.username} onPress={() => router.push(`/${d.username}`)} style={[styles.demo, { backgroundColor: d.bg }]} accessibilityRole="link">
            <Text style={[styles.demoName, { color: d.fg }]}>{d.name}</Text>
            <Text style={{ color: d.fg, opacity: 0.85 }}>{d.what}</Text>
            <Text style={[styles.demoUrl, { color: d.fg }]}>/{d.username}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => router.push(user ? "/dashboard" : "/login")}
          style={[styles.button, { backgroundColor: brand.plum, marginTop: 28 }]}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, { color: brand.paper }]}>{user ? `Manage @${user.username}` : "Log in to manage your events"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.sun },
  content: { padding: 16, paddingBottom: 48 },
  logo: { fontSize: 20, fontWeight: "800", color: brand.plum, marginTop: 8 },
  title: { fontSize: 40, lineHeight: 42, fontWeight: "800", color: brand.plum, marginTop: 24, marginBottom: 24, letterSpacing: -1 },
  claim: { flexDirection: "row", alignItems: "center", height: 56, paddingHorizontal: 16, borderRadius: 10, backgroundColor: "#ffffff" },
  host: { color: "#8a7a96", fontWeight: "600", fontSize: 16, maxWidth: "60%" },
  input: { flex: 1, fontSize: 17, fontWeight: "700", color: brand.plum },
  button: { minHeight: 52, borderRadius: 64, alignItems: "center", justifyContent: "center", marginTop: 10, paddingHorizontal: 20 },
  buttonText: { fontWeight: "800", fontSize: 16 },
  head: { fontSize: 24, fontWeight: "800", color: brand.plum, marginTop: 36, marginBottom: 12 },
  demo: { borderRadius: 22, padding: 20, marginBottom: 12, gap: 4 },
  demoName: { fontSize: 22, fontWeight: "800" },
  demoUrl: { fontWeight: "700", marginTop: 14 },
});
