import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Redirect, router } from "expo-router";
import { ApiError } from "@event-tree/api-client";
import { useAuth } from "../src/auth/AuthContext";
import { WEB_HOST, api } from "../src/lib/api";
import { Icon } from "../src/ui/Icon";
import { Btn, InlineError, TextField } from "../src/ui/kit";
import { corner, gap, usePalette } from "../src/ui/palette";

type Availability = { state: "idle" | "checking" | "ok" | "bad"; message?: string };

/** Pick the username for your page, after creating an account. */
export default function ClaimScreen() {
  const p = usePalette();
  const { identity, user, claim } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [availability, setAvailability] = useState<Availability>({ state: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Check the name as the host types, after a short pause.
  useEffect(() => {
    const name = username.trim().toLowerCase();
    if (!name) return setAvailability({ state: "idle" });
    setAvailability({ state: "checking" });
    const id = setTimeout(async () => {
      try {
        const r = await api.checkUsername(name);
        setAvailability(r.available ? { state: "ok", message: "It's yours to claim." } : { state: "bad", message: r.reason });
      } catch {
        setAvailability({ state: "bad", message: "Couldn't check that name. Try again." });
      }
    }, 300);
    return () => clearTimeout(id);
  }, [username]);

  if (!identity) return <Redirect href="/login" />;
  if (user) return <Redirect href="/dashboard" />;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await claim({ username: username.trim(), displayName: displayName.trim() || undefined });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create your page.");
    } finally {
      setBusy(false);
    }
  }

  const ring = availability.state === "ok" ? p.success : availability.state === "bad" ? p.danger : "transparent";

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: p.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 8 }}>
          <Text style={[s.h1, { color: p.text }]}>Claim your link</Text>
          <Text style={{ color: p.textMuted, fontSize: 16, lineHeight: 23 }}>This is the name people see in your link. You can't change it later.</Text>
        </View>

        <View style={{ gap: 8 }}>
          <View style={[s.claim, { backgroundColor: p.surface, borderColor: ring }]}>
            <Text style={{ color: p.textSubtle, fontSize: 16, fontWeight: "600", maxWidth: "55%" }} numberOfLines={1}>
              {WEB_HOST}/
            </Text>
            <TextInput
              value={username}
              onChangeText={(v) => setUsername(v.replace(/\s/g, ""))}
              placeholder="yourname"
              placeholderTextColor={p.textSubtle}
              selectionColor={p.accent}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              accessibilityLabel="Username"
              style={{ flex: 1, color: p.text, fontSize: 17, fontWeight: "800" }}
            />
            {availability.state === "checking" && <ActivityIndicator color={p.textMuted} />}
            {availability.state === "ok" && <Icon name="check" size={20} color={p.success} strokeWidth={3} />}
          </View>
          {(availability.state === "ok" || availability.state === "bad") && (
            <Text style={{ color: availability.state === "ok" ? p.success : p.danger, fontWeight: "600", fontSize: 14 }} accessibilityLiveRegion="polite">
              {availability.message}
            </Text>
          )}
        </View>

        <TextField label="Page name" value={displayName} onChangeText={setDisplayName} placeholder="City Jazz Nights" maxLength={60} hint="Shown big at the top of your page." />
        <InlineError>{error}</InlineError>
        <Btn title={busy ? "Creating your page…" : "Create my page"} onPress={submit} loading={busy} disabled={availability.state !== "ok"} />
        <Text style={{ color: p.textSubtle, fontSize: 13, textAlign: "center" }}>Signed in as {identity.email}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  content: { padding: gap.lg, paddingTop: gap.lg, paddingBottom: 48, gap: gap.xl },
  h1: { fontSize: 34, lineHeight: 38, fontWeight: "900", letterSpacing: -1 },
  claim: { flexDirection: "row", alignItems: "center", gap: 8, height: 60, paddingHorizontal: 16, borderRadius: corner.md, borderWidth: 2 },
});
