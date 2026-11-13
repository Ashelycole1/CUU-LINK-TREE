import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ApiError } from "@event-tree/api-client";
import { ErrorText, Field, PrimaryButton } from "../../src/components/Field";
import { api } from "../../src/lib/api";
import { pickImage } from "../../src/lib/pickImage";
import { brand, tokens } from "../../src/theme";

/** "2026-12-05 14:00" in the phone's time zone → ISO string. Empty or invalid → "" (the API explains). */
function toIso(local: string): string {
  const match = local.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const [, y, m, d, h, min] = match.map(Number) as number[];
  return new Date(y!, m! - 1, d!, h!, min!).toISOString();
}

/** Add an event to your page from the phone. Plain text date fields keep the app free of native picker modules. */
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
  const [uploading, setUploading] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value });

  /** Picks a poster from the photo library and stores it in Neon Object Storage. */
  async function uploadPoster() {
    setError(null);
    try {
      const image = await pickImage();
      if (!image) return;
      setUploading(true);
      const { url } = await api.uploadImage(image.body, image.type);
      setForm((f) => ({ ...f, coverUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload that image.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api.createEvent({
        title: form.title,
        category: form.category,
        startsAt: toIso(form.startsAt),
        endsAt: toIso(form.endsAt),
        venue: form.venue,
        description: form.description,
        coverImage: form.coverUrl.trim() ? { url: form.coverUrl.trim(), alt: `${form.title} poster` } : null,
        links: form.registerUrl.trim() ? [{ label: "Register", url: form.registerUrl.trim(), kind: "register", primary: true }] : [],
      });
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add the event.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Field label="Title" value={form.title} onChangeText={set("title")} maxLength={120} />
          <Field label="Category" value={form.category} onChangeText={set("category")} placeholder="Music, Talks, Sports…" maxLength={40} />
          <Field label="Starts (YYYY-MM-DD HH:MM)" value={form.startsAt} onChangeText={set("startsAt")} placeholder="2026-12-05 14:00" />
          <Field label="Ends (YYYY-MM-DD HH:MM)" value={form.endsAt} onChangeText={set("endsAt")} placeholder="2026-12-05 17:00" />
          <Field label="Venue" value={form.venue} onChangeText={set("venue")} maxLength={120} />
          <Field label="Description" value={form.description} onChangeText={set("description")} multiline maxLength={2000} />
          <View style={styles.poster}>
            {form.coverUrl.trim() ? <Image source={{ uri: form.coverUrl.trim() }} style={styles.posterPreview} accessibilityIgnoresInvertColors /> : null}
            <Pressable onPress={uploadPoster} disabled={uploading} style={styles.uploadButton} accessibilityRole="button">
              <Text style={styles.uploadText}>{uploading ? "Uploading…" : form.coverUrl ? "Change poster" : "Upload a poster"}</Text>
            </Pressable>
          </View>
          <Field label="…or poster image link" value={form.coverUrl} onChangeText={set("coverUrl")} placeholder="https://…" keyboardType="url" autoCapitalize="none" />
          <Field label="Registration link" value={form.registerUrl} onChangeText={set("registerUrl")} placeholder="https://…" keyboardType="url" autoCapitalize="none" />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title={busy ? "Adding…" : "Add event"} onPress={submit} disabled={busy} />
          <Text style={styles.hint}>It goes to the top of your page. Reorder or hide it from Your events.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: tokens.gutter, paddingBottom: 48 },
  card: { backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderColor: brand.line, padding: 20, gap: 14 },
  hint: { color: tokens.inkMuted, fontSize: 12, textAlign: "center" },
  poster: { flexDirection: "row", alignItems: "center", gap: 12 },
  posterPreview: { width: 72, height: 72, borderRadius: 12, backgroundColor: brand.line },
  uploadButton: { flex: 1, minHeight: 48, borderRadius: tokens.radiusPill, borderWidth: 2, borderColor: brand.plum, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  uploadText: { color: brand.plum, fontWeight: "700", fontSize: 15 },
});
