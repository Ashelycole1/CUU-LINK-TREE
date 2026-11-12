import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ApiError } from "@event-tree/api-client";
import { ErrorText, Field, PrimaryButton } from "../src/components/Field";
import { api } from "../src/lib/api";
import { tokens } from "../src/theme";

/** "2026-12-05 14:00" in the phone's time zone → ISO string. Empty or invalid → "" (the API explains). */
function toIso(local: string): string {
  const match = local.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const [, y, m, d, h, min] = match.map(Number) as number[];
  return new Date(y!, m! - 1, d!, h!, min!).toISOString();
}

/** Post an upcoming event from the phone. Plain text date fields keep the app free of native picker modules. */
export default function NewEventScreen() {
  const [form, setForm] = useState({
    title: "",
    category: "",
    startsAt: "",
    endsAt: "",
    venue: "",
    description: "",
    coverUrl: "",
    registerUrl: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value });

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const event = await api.createEvent({
        title: form.title,
        category: form.category,
        startsAt: toIso(form.startsAt),
        endsAt: toIso(form.endsAt),
        venue: form.venue,
        description: form.description,
        coverImage: form.coverUrl.trim() ? { url: form.coverUrl.trim(), alt: `${form.title} poster` } : null,
        links: form.registerUrl.trim() ? [{ label: "Register", url: form.registerUrl.trim(), kind: "register", primary: true }] : [],
      });
      router.replace(`/e/${event.slug}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not post the event.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Field label="Title" value={form.title} onChangeText={set("title")} maxLength={120} />
          <Field label="Category" value={form.category} onChangeText={set("category")} placeholder="Tech, Career, Sports…" maxLength={40} />
          <Field label="Starts (YYYY-MM-DD HH:MM)" value={form.startsAt} onChangeText={set("startsAt")} placeholder="2026-12-05 14:00" />
          <Field label="Ends (YYYY-MM-DD HH:MM)" value={form.endsAt} onChangeText={set("endsAt")} placeholder="2026-12-05 17:00" />
          <Field label="Venue" value={form.venue} onChangeText={set("venue")} maxLength={120} />
          <Field label="Description" value={form.description} onChangeText={set("description")} multiline maxLength={2000} />
          <Field label="Poster image link" value={form.coverUrl} onChangeText={set("coverUrl")} placeholder="https://…" keyboardType="url" autoCapitalize="none" />
          <Field label="Registration link" value={form.registerUrl} onChangeText={set("registerUrl")} placeholder="https://…" keyboardType="url" autoCapitalize="none" />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title={busy ? "Posting…" : "Post event"} onPress={submit} disabled={busy} />
          <Text style={styles.hint}>If the API has an ADMIN_KEY set, post from the web app, which can send the key.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: tokens.gutter, paddingBottom: 48 },
  card: { backgroundColor: "#fff", borderRadius: tokens.radiusCard, padding: 20, gap: 14 },
  hint: { color: tokens.inkMuted, fontSize: 12, textAlign: "center" },
});
