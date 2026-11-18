import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError, EVENT_CATEGORIES, type EventLinkKind } from "@event-tree/api-client";
import { api } from "../../src/lib/api";
import { flash } from "../../src/lib/flash";
import { IMAGE_SIZES, pickImage } from "../../src/lib/pickImage";
import { DateTimeField } from "../../src/ui/DateTimeField";
import { Icon, LINK_ICONS, categoryIcon } from "../../src/ui/Icon";
import { Btn, Chip, CoverArt, InlineError, Row, StepHead, TextField } from "../../src/ui/kit";
import { corner, gap, usePalette } from "../../src/ui/palette";

const DURATIONS = [1, 2, 3, 4, 6];
const KINDS: { id: EventLinkKind; label: string }[] = [
  { id: "tickets", label: "Tickets" },
  { id: "register", label: "Register" },
  { id: "livestream", label: "Livestream" },
  { id: "agenda", label: "Agenda" },
  { id: "slides", label: "Slides" },
  { id: "recording", label: "Recording" },
];

interface LinkRow {
  label: string;
  url: string;
  kind: EventLinkKind;
}

function startsIn(start: Date, now = Date.now()): string {
  const hours = Math.round((start.getTime() - now) / 3_600_000);
  if (hours < 0) return "That start time is in the past";
  if (hours < 1) return "Starts within the hour";
  if (hours < 24) return `Starts in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Starts tomorrow" : `Starts in ${days} days`;
}

/**
 * Add an event in four steps, the order hosts plan in: what it is, when and
 * where, the poster, and the buttons people need. A preview at the top shows
 * how it will look on the page as you type.
 */
export default function NewEventScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ title: "", category: "", description: "", venue: "", organizer: "", coverUrl: "" });
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pasteLink, setPasteLink] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const cover = form.coverUrl.trim();
  const hours = startsAt && endsAt ? Math.round((endsAt.getTime() - startsAt.getTime()) / 3_600_000) : null;
  const mainLink = links.find((l) => l.url.trim());
  const ready = form.title.trim().length >= 3 && form.category.trim() && startsAt && endsAt;

  function pickStart(d: Date) {
    setStep(2);
    // Keep the length the same when the start moves; default to 3 hours.
    const length = startsAt && endsAt ? endsAt.getTime() - startsAt.getTime() : 3 * 3_600_000;
    setStartsAt(d);
    setEndsAt(new Date(d.getTime() + Math.max(length, 30 * 60_000)));
  }

  function lasts(h: number) {
    if (startsAt) setEndsAt(new Date(startsAt.getTime() + h * 3_600_000));
  }

  function addLink(kind: EventLinkKind) {
    setStep(4);
    const label = KINDS.find((k) => k.id === kind)!.label;
    setLinks((l) => [...l, { label, url: "", kind }]);
  }
  const setLink = (i: number, patch: Partial<LinkRow>) => setLinks((l) => l.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const moveUp = (i: number) =>
    setLinks((l) => {
      if (i === 0) return l;
      const next = [...l];
      [next[i - 1], next[i]] = [next[i]!, next[i - 1]!];
      return next;
    });

  async function uploadPoster() {
    setError(null);
    setStep(3);
    try {
      const image = await pickImage({ maxSide: IMAGE_SIZES.poster });
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
        startsAt: startsAt ? startsAt.toISOString() : "",
        endsAt: endsAt ? endsAt.toISOString() : "",
        venue: form.venue,
        organizer: form.organizer,
        description: form.description,
        coverImage: cover ? { url: cover, alt: `${form.title} poster` } : null,
        links: links
          .filter((l) => l.url.trim())
          .map((l, i) => ({ label: l.label || "Link", url: l.url.trim(), kind: l.kind, primary: i === 0 })),
      });
      flash.set(form.title.trim());
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add the event.");
    } finally {
      setBusy(false);
    }
  }

  const section = [s.step, { borderTopColor: p.border }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: p.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen
        options={{
          title: "New event",
          headerStyle: { backgroundColor: p.bg },
          headerTintColor: p.text,
          contentStyle: { backgroundColor: p.bg },
        }}
      />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: 120 + insets.bottom }]} keyboardShouldPersistTaps="handled">
        {/* How it will look on the page, updated as you type. */}
        <View style={[s.preview, { backgroundColor: p.bgElevated, borderColor: p.border }]} accessibilityLabel="Preview of how the event will look">
          <Text style={[s.previewLabel, { color: p.textSubtle }]}>On your page</Text>
          <View style={s.previewRow}>
            <View style={s.previewDate}>
              <Text style={[s.previewDay, { color: p.text }]}>{startsAt ? startsAt.getDate() : "--"}</Text>
              <Text style={[s.previewMonth, { color: p.textSubtle }]}>{startsAt ? startsAt.toLocaleDateString(undefined, { month: "short" }) : "Date"}</Text>
            </View>
            <CoverArt uri={cover || null} name={form.title || "New event"} category={form.category} size={48} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.previewTitle, { color: p.text }]} numberOfLines={1}>
                {form.title || "Your event title"}
              </Text>
              <Text style={{ color: p.textSubtle, fontSize: 13 }} numberOfLines={1}>
                {form.venue || form.category || "Venue"}
              </Text>
            </View>
          </View>
          <Text style={{ color: p.textMuted, fontSize: 13, fontWeight: "600" }}>{startsAt ? startsIn(startsAt) : "Pick a start time to see the countdown"}</Text>
          {mainLink && (
            <View style={[s.previewBtn, { backgroundColor: p.accent }]}>
              <Icon name={LINK_ICONS[mainLink.kind]} size={16} color={p.onAccent} />
              <Text style={{ color: p.onAccent, fontWeight: "800", fontSize: 14 }} numberOfLines={1}>
                {mainLink.label || "Link"}
              </Text>
            </View>
          )}
        </View>

        {/* 1. What is it? */}
        <View style={[s.step, { borderTopWidth: 0 }]}>
          <StepHead n={1} title="What is it?" active={step === 1} />
          <TextField label="Title" value={form.title} onChangeText={set("title")} onFocus={() => setStep(1)} maxLength={120} placeholder="Opening Night" />
          <View style={{ gap: 8 }}>
            <Text style={{ color: p.text, fontSize: 14, fontWeight: "700" }}>
              Category <Text style={{ color: p.textSubtle, fontWeight: "500" }}>people filter by this in Community</Text>
            </Text>
            <Row>
              {EVENT_CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  icon={categoryIcon(c)}
                  selected={form.category === c}
                  onPress={() => {
                    setStep(1);
                    setForm((f) => ({ ...f, category: c }));
                  }}
                />
              ))}
            </Row>
          </View>
          <TextField
            label="Description"
            optional
            value={form.description}
            onChangeText={set("description")}
            onFocus={() => setStep(1)}
            multiline
            maxLength={2000}
            placeholder="What happens, who it is for, anything to bring."
          />
        </View>

        {/* 2. When and where? */}
        <View style={section}>
          <StepHead n={2} title="When and where?" active={step === 2} />
          <DateTimeField label="Starts" value={startsAt} onChange={pickStart} minimumDate={new Date()} />
          <Text style={[s.small, { color: p.text }]}>How long?</Text>
          <Row>
            {DURATIONS.map((h) => (
              <Chip key={h} label={`${h} hour${h === 1 ? "" : "s"}`} selected={hours === h} disabled={!startsAt} onPress={() => lasts(h)} />
            ))}
            <Chip label="All day" selected={hours === 24} disabled={!startsAt} onPress={() => lasts(24)} />
          </Row>
          <DateTimeField
            label="Ends"
            value={endsAt}
            onChange={(d) => {
              setStep(2);
              setEndsAt(d);
            }}
            minimumDate={startsAt ?? undefined}
            placeholder="After the start"
          />
          <TextField label="Venue" optional value={form.venue} onChangeText={set("venue")} onFocus={() => setStep(2)} maxLength={120} placeholder="The Terrace, 14 Kampala Road" />
          <TextField label="Organiser" optional value={form.organizer} onChangeText={set("organizer")} onFocus={() => setStep(2)} maxLength={80} />
        </View>

        {/* 3. Poster */}
        <View style={section}>
          <StepHead n={3} title="Poster" optional active={step === 3} />
          <Pressable
            onPress={uploadPoster}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel={cover ? "Change poster" : "Upload a poster"}
            style={({ pressed }) => [s.poster, { backgroundColor: p.surface, borderColor: p.borderStrong, opacity: pressed ? 0.85 : 1 }]}
          >
            {cover ? (
              <>
                <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
                <View style={s.posterBadge}>
                  <Text style={{ color: "#ffffff", fontWeight: "700" }}>{uploading ? "Uploading…" : "Change poster"}</Text>
                </View>
              </>
            ) : (
              <View style={s.posterEmpty}>
                <Icon name="image" size={28} color={p.textMuted} />
                <Text style={{ color: p.text, fontSize: 16, fontWeight: "800" }}>{uploading ? "Uploading…" : "Upload a poster"}</Text>
                <Text style={{ color: p.textSubtle, fontSize: 13, textAlign: "center" }}>No poster? The event gets a colour tile with an icon for its category.</Text>
              </View>
            )}
          </Pressable>
          {pasteLink ? (
            <TextField label="Poster image link" value={form.coverUrl} onChangeText={set("coverUrl")} placeholder="https://" keyboardType="url" autoCapitalize="none" autoCorrect={false} />
          ) : (
            <Pressable onPress={() => setPasteLink(true)} hitSlop={8} accessibilityRole="button" style={{ alignSelf: "flex-start", paddingVertical: 4 }}>
              <Text style={{ color: p.text, fontWeight: "700", textDecorationLine: "underline" }}>Paste an image link instead</Text>
            </Pressable>
          )}
        </View>

        {/* 4. Buttons people need */}
        <View style={section}>
          <StepHead n={4} title="Buttons people need" active={step === 4} />
          <Text style={[s.small, { color: p.textSubtle, fontWeight: "400" }]}>The first button is the big yellow one on the event page.</Text>
          <Row>
            {KINDS.map((k) => (
              <Chip key={k.id} label={k.label} icon="plus" onPress={() => addLink(k.id)} disabled={links.length >= 12} />
            ))}
          </Row>
          {links.map((l, i) => (
            <View key={i} style={[s.link, { backgroundColor: p.surface, borderColor: i === 0 ? p.accent : "transparent" }]}>
              <View style={s.linkTop}>
                <View style={[s.linkIcon, { backgroundColor: i === 0 ? p.accent : p.surfaceHigh }]}>
                  <Icon name={LINK_ICONS[l.kind]} size={18} color={i === 0 ? p.onAccent : p.textMuted} />
                </View>
                <TextInput
                  value={l.label}
                  onChangeText={(t) => setLink(i, { label: t })}
                  onFocus={() => setStep(4)}
                  placeholder="Label"
                  placeholderTextColor={p.textSubtle}
                  maxLength={40}
                  accessibilityLabel="Button label"
                  style={[s.linkLabel, { color: p.text }]}
                />
                {i > 0 && (
                  <Pressable onPress={() => moveUp(i)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Move button up" style={s.linkTool}>
                    <Icon name="up" size={18} color={p.textMuted} />
                  </Pressable>
                )}
                <Pressable onPress={() => setLinks((x) => x.filter((_, j) => j !== i))} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove button" style={s.linkTool}>
                  <Icon name="close" size={18} color={p.textMuted} />
                </Pressable>
              </View>
              <TextInput
                value={l.url}
                onChangeText={(t) => setLink(i, { url: t })}
                onFocus={() => setStep(4)}
                placeholder="https://"
                placeholderTextColor={p.textSubtle}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={`${l.label || "Button"} link`}
                style={[s.linkUrl, { color: p.text, backgroundColor: p.bg }]}
              />
            </View>
          ))}
          {links.length === 0 && <Text style={{ color: p.textSubtle, fontSize: 14 }}>No buttons yet. Tap Tickets or Register above to add one.</Text>}
        </View>

        <InlineError>{error}</InlineError>
      </ScrollView>

      {/* The action stays in reach of your thumb. */}
      <View style={[s.bar, { backgroundColor: p.bg, borderTopColor: p.border, paddingBottom: 12 + insets.bottom }]}>
        <Text style={{ flex: 1, color: p.textSubtle, fontSize: 13 }} numberOfLines={2}>
          {ready ? "Goes on your page and in Community." : "Add a title, pick a category and a start time."}
        </Text>
        <Btn title={busy ? "Adding…" : "Add event"} onPress={submit} loading={busy} disabled={!ready || uploading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  content: { padding: gap.lg, gap: 0 },
  preview: { gap: 12, padding: 16, borderRadius: corner.lg, borderWidth: 1, marginBottom: gap.xl },
  previewLabel: { fontSize: 13, fontWeight: "700" },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  previewDate: { width: 36, alignItems: "center" },
  previewDay: { fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
  previewMonth: { fontSize: 11, fontWeight: "600" },
  previewTitle: { fontSize: 16, fontWeight: "700" },
  previewBtn: { flexDirection: "row", alignItems: "center", gap: 8, height: 40, paddingHorizontal: 14, borderRadius: corner.pill },
  step: { gap: gap.lg, paddingVertical: gap.xl, borderTopWidth: StyleSheet.hairlineWidth },
  small: { fontSize: 14, fontWeight: "700" },
  poster: { aspectRatio: 1, borderRadius: corner.lg, overflow: "hidden", borderWidth: 1.5, borderStyle: "dashed" },
  posterEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: gap.xl },
  posterBadge: { position: "absolute", right: 10, bottom: 10, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: corner.pill, paddingHorizontal: 14, paddingVertical: 8 },
  link: { gap: 8, padding: 8, borderRadius: corner.md, borderWidth: 2 },
  linkTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  linkIcon: { width: 36, height: 36, borderRadius: corner.sm, alignItems: "center", justifyContent: "center" },
  linkLabel: { flex: 1, fontSize: 16, fontWeight: "700", paddingVertical: 8 },
  linkTool: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  linkUrl: { minHeight: 44, borderRadius: corner.sm, paddingHorizontal: 12, fontSize: 15 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: gap.lg, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
