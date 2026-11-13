import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ApiError } from "@event-tree/api-client";
import { useAuth } from "../src/auth/AuthContext";
import { ErrorText, Field, PrimaryButton } from "../src/components/Field";
import { brand } from "../src/theme";

/** Log in, or create an account (Neon Auth). New accounts then claim a username. */
export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const creating = mode === "signup";

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const input = { email: email.trim(), password };
      const me = creating ? await signUp({ ...input, name: name.trim() || input.email.split("@")[0]! }) : await signIn(input);
      router.replace(me.user ? "/dashboard" : "/claim");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : creating ? "Couldn't create your account." : "Couldn't log in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>{creating ? "Create your account" : "Welcome back"}</Text>
          {creating && <Field label="Your name" value={name} onChangeText={setName} autoComplete="name" maxLength={60} />}
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={creating ? "new-password" : "current-password"}
            placeholder={creating ? "At least 8 characters" : undefined}
          />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton
            title={busy ? (creating ? "Creating…" : "Logging in…") : creating ? "Create account" : "Log in"}
            onPress={submit}
            disabled={busy || !email.trim() || !password}
          />
          <Pressable
            onPress={() => {
              setMode(creating ? "signin" : "signup");
              setError(null);
            }}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.switch}>{creating ? "Already have a page? Log in" : "New here? Create an account"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 20, gap: 14, borderWidth: 2, borderColor: brand.plum },
  title: { fontSize: 28, fontWeight: "800", color: brand.plum },
  switch: { color: brand.plum, fontWeight: "700", textAlign: "center", textDecorationLine: "underline", paddingVertical: 6 },
});
