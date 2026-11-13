import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { ApiError } from "@event-tree/api-client";
import { useAuth } from "../src/auth/AuthContext";
import { ErrorText, Field, PrimaryButton } from "../src/components/Field";
import { WEB_HOST, api } from "../src/lib/api";
import { brand } from "../src/theme";

type Availability = { state: "idle" | "checking" | "ok" | "bad"; message?: string };

/** Pick the username for your page, after creating an account. */
export default function ClaimScreen() {
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
        setAvailability(r.available ? { state: "ok", message: `${WEB_HOST}/${r.username} is yours to claim.` } : { state: "bad", message: r.reason });
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Claim your page</Text>
          <Text style={styles.body}>Pick the name people will see in your link. You can't change it later.</Text>
          <Field
            label={`${WEB_HOST}/`}
            value={username}
            onChangeText={(v) => setUsername(v.replace(/\s/g, ""))}
            placeholder="yourname"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Username"
          />
          {availability.state !== "idle" && (
            <Text style={[styles.status, availability.state === "bad" && styles.bad]} accessibilityLiveRegion="polite">
              {availability.state === "checking" ? "Checking…" : availability.message}
            </Text>
          )}
          <Field label="Page name" value={displayName} onChangeText={setDisplayName} placeholder="e.g. City Jazz Nights" maxLength={60} />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title={busy ? "Creating your page…" : "Create my page"} onPress={submit} disabled={busy || availability.state !== "ok"} />
          <Text style={styles.hint}>Signed in as {identity.email}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 20, gap: 14, borderWidth: 2, borderColor: brand.plum },
  title: { fontSize: 28, fontWeight: "800", color: brand.plum },
  body: { color: brand.ink2, fontSize: 15 },
  status: { color: "#1b7a3d", fontWeight: "600" },
  bad: { color: "#c62828" },
  hint: { color: brand.ink2, fontSize: 13, textAlign: "center" },
});
