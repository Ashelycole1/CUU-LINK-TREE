import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ApiError, EMAIL_NOT_VERIFIED, type MeDTO } from "@event-tree/api-client";
import { useAuth } from "../src/auth/AuthContext";
import { ErrorText, Field, PrimaryButton } from "../src/components/Field";
import { brand } from "../src/theme";

/**
 * Log in, or create an account (Neon Auth). New accounts first enter the
 * code emailed to them, then claim a username.
 */
export default function LoginScreen() {
  const { signIn, signUp, verifyEmail, resendCode } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "verify">("signin");
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const creating = mode === "signup";

  const open = (me: MeDTO) => router.replace(me.user ? "/dashboard" : "/claim");

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const input = { email: email.trim(), password };
      open(creating ? await signUp({ ...input, name: name.trim() || input.email.split("@")[0]! }) : await signIn(input));
    } catch (err) {
      // New account, or one that never entered its code: Neon Auth has emailed a code.
      if (err instanceof ApiError && err.code === EMAIL_NOT_VERIFIED) {
        setCode("");
        setNote(null);
        setMode("verify");
        return;
      }
      setError(err instanceof ApiError ? err.message : creating ? "Couldn't create your account." : "Couldn't log in.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      open(await verifyEmail({ email: email.trim(), otp: code.trim() }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't check that code.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError(null);
    setNote(null);
    try {
      await resendCode(email.trim());
      setNote("We sent a new code. Check your inbox.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send a new code.");
    }
  }

  if (mode === "verify") {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.body}>We sent a code to {email.trim()}. Enter it below to finish signing up.</Text>
            <Field
              label="Code"
              value={code}
              onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={8}
              autoFocus
            />
            <ErrorText>{error}</ErrorText>
            {note && <Text style={styles.note}>{note}</Text>}
            <PrimaryButton title={busy ? "Checking…" : "Verify"} onPress={verify} disabled={busy || code.trim().length < 4} />
            <Pressable onPress={resend} hitSlop={8} accessibilityRole="button">
              <Text style={styles.switch}>Send a new code</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode("signup");
                setError(null);
              }}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={styles.switch}>Use a different email</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
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
  body: { fontSize: 16, color: brand.plum },
  note: { color: brand.plum, fontWeight: "600" },
  switch: { color: brand.plum, fontWeight: "700", textAlign: "center", textDecorationLine: "underline", paddingVertical: 6 },
});
