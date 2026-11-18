import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ApiError, EMAIL_NOT_VERIFIED, type MeDTO } from "@event-tree/api-client";
import { useAuth } from "../src/auth/AuthContext";
import { Icon } from "../src/ui/Icon";
import { Btn, InlineError, TextField } from "../src/ui/kit";
import { corner, gap, usePalette } from "../src/ui/palette";

/**
 * Log in, or create an account (Neon Auth). New accounts first enter the
 * code emailed to them, then claim a username.
 */
export default function LoginScreen() {
  const p = usePalette();
  const { signIn, signUp, verifyEmail, resendCode } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "verify">("signin");
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const link = (label: string, onPress: () => void) => (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" style={{ alignSelf: "center", paddingVertical: 8 }}>
      <Text style={{ color: p.text, fontWeight: "700", fontSize: 15, textDecorationLine: "underline" }}>{label}</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: p.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={[s.mark, { backgroundColor: p.accent }]}>
          <Icon name={mode === "verify" ? "check" : "calendar"} size={24} color={p.onAccent} strokeWidth={2.5} />
        </View>

        {mode === "verify" ? (
          <>
            <View style={{ gap: 8 }}>
              <Text style={[s.h1, { color: p.text }]}>Check your email</Text>
              <Text style={{ color: p.textMuted, fontSize: 16, lineHeight: 23 }}>
                We sent a code to <Text style={{ color: p.text, fontWeight: "700" }}>{email.trim()}</Text>. Enter it to finish signing up.
              </Text>
            </View>
            <TextField
              label="Code"
              value={code}
              onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={8}
              autoFocus
            />
            <InlineError>{error}</InlineError>
            {note && <Text style={{ color: p.success, fontWeight: "600" }}>{note}</Text>}
            <Btn title={busy ? "Checking…" : "Verify"} onPress={verify} loading={busy} disabled={code.trim().length < 4} />
            {link("Send a new code", resend)}
            {link("Use a different email", () => {
              setMode("signup");
              setError(null);
            })}
          </>
        ) : (
          <>
            <View style={{ gap: 8 }}>
              <Text style={[s.h1, { color: p.text }]}>{creating ? "Get your page" : "Welcome back"}</Text>
              <Text style={{ color: p.textMuted, fontSize: 16, lineHeight: 23 }}>
                {creating ? "Free. One link for every event you host." : "Log in to manage your events."}
              </Text>
            </View>

            {/* Log in / Sign up */}
            <View style={[s.segment, { backgroundColor: p.surface }]} accessibilityRole="tablist">
              {(["signin", "signup"] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMode(m);
                    setError(null);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === m }}
                  style={[s.segBtn, mode === m && { backgroundColor: p.text }]}
                >
                  <Text style={{ color: mode === m ? p.bg : p.text, fontWeight: "800", fontSize: 14 }}>{m === "signin" ? "Log in" : "Sign up"}</Text>
                </Pressable>
              ))}
            </View>

            {creating && <TextField label="Your name" value={name} onChangeText={setName} autoComplete="name" maxLength={60} />}
            <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <View>
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={creating ? "new-password" : "current-password"}
                placeholder={creating ? "At least 8 characters" : undefined}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                style={s.eye}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} size={20} color={p.textMuted} />
              </Pressable>
            </View>
            <InlineError>{error}</InlineError>
            <Btn
              title={busy ? (creating ? "Creating…" : "Logging in…") : creating ? "Create account" : "Log in"}
              onPress={submit}
              loading={busy}
              disabled={!email.trim() || !password}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  content: { padding: gap.lg, paddingTop: gap.xl, paddingBottom: 48, gap: gap.lg },
  mark: { width: 48, height: 48, borderRadius: corner.lg, alignItems: "center", justifyContent: "center" },
  h1: { fontSize: 34, lineHeight: 38, fontWeight: "900", letterSpacing: -1 },
  segment: { flexDirection: "row", padding: 4, borderRadius: corner.pill },
  segBtn: { flex: 1, height: 40, borderRadius: corner.pill, alignItems: "center", justifyContent: "center" },
  eye: { position: "absolute", right: 12, bottom: 14 },
});
