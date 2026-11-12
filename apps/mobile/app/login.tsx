import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ApiError } from "@event-tree/api-client";
import { useAuth } from "../src/auth/AuthContext";
import { ErrorText, Field, PrimaryButton } from "../src/components/Field";
import { brand } from "../src/theme";

/** Host log-in. New pages are claimed on the web app. */
export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't log in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title={busy ? "Logging in…" : "Log in"} onPress={submit} disabled={busy} />
          <Text style={styles.hint}>No page yet? Claim one on the Event Tree website, then log in here.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 20, gap: 14, borderWidth: 2, borderColor: brand.plum },
  title: { fontSize: 28, fontWeight: "800", color: brand.plum },
  hint: { color: brand.ink2, fontSize: 13, textAlign: "center" },
});
