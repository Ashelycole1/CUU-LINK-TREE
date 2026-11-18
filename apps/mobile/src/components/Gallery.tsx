import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError, type EventDTO, type ImageLinkDTO } from "@event-tree/api-client";
import { api } from "../lib/api";
import { IMAGE_SIZES, pickImage } from "../lib/pickImage";
import { Icon } from "../ui/Icon";
import { Btn, InlineError, TextField } from "../ui/kit";
import { corner, usePalette } from "../ui/palette";

interface Props {
  event: EventDTO;
  onUpdated: (event: EventDTO) => void;
}

/** Three-column photo grid with a full-screen viewer, and a way to add your own photo. */
export function Gallery({ event, onUpdated }: Props) {
  const p = usePalette();
  const [open, setOpen] = useState<ImageLinkDTO | null>(null);
  const [adding, setAdding] = useState(false);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    setError(null);
    try {
      const image = await pickImage({ maxSide: IMAGE_SIZES.photo });
      if (!image) return;
      setBusy(true);
      onUpdated(await api.uploadEventPhoto(event.id, image.body, image.type, caption));
      setCaption("");
      setAdding(false);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not add that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={s.grid}>
        {event.gallery.map((img) => (
          <Pressable key={img.url} style={[s.cell, { backgroundColor: p.surface }]} onPress={() => setOpen(img)} accessibilityRole="imagebutton" accessibilityLabel={img.alt || "Open photo"}>
            <Image source={{ uri: img.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </Pressable>
        ))}
        {!adding && (
          <Pressable
            onPress={() => setAdding(true)}
            accessibilityRole="button"
            accessibilityLabel="Add your photo"
            style={({ pressed }) => [s.cell, s.addCell, { borderColor: p.borderStrong, backgroundColor: pressed ? p.surface : "transparent" }]}
          >
            <Icon name="camera" size={22} color={p.textMuted} />
            <Text style={{ color: p.textMuted, fontSize: 12, fontWeight: "700" }}>Add yours</Text>
          </Pressable>
        )}
      </View>
      {event.gallery.length === 0 && !adding && <Text style={{ color: p.textSubtle, fontSize: 14 }}>No photos yet. Were you there?</Text>}

      {adding && (
        <View style={[s.add, { backgroundColor: p.bgElevated, borderColor: p.border }]}>
          <TextField label="Caption" optional value={caption} onChangeText={setCaption} maxLength={200} placeholder="Say something about it" />
          <InlineError>{error}</InlineError>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Btn title="Cancel" variant="secondary" onPress={() => setAdding(false)} style={{ flex: 1 }} />
            <Btn title={busy ? "Uploading…" : "Choose photo"} icon="image" onPress={add} loading={busy} style={{ flex: 1.4 }} />
          </View>
        </View>
      )}

      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable style={s.viewer} onPress={() => setOpen(null)} accessibilityRole="button" accessibilityLabel="Close photo">
          {open && <Image source={{ uri: open.url }} style={s.full} resizeMode="contain" />}
          {!!open?.caption && <Text style={s.caption}>{open.caption}</Text>}
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cell: { width: "32%", aspectRatio: 1, borderRadius: corner.sm, overflow: "hidden" },
  addCell: { borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 },
  add: { gap: 12, padding: 14, borderRadius: corner.lg, borderWidth: 1 },
  viewer: { flex: 1, backgroundColor: "rgba(0,0,0,0.94)", alignItems: "center", justifyContent: "center", padding: 16 },
  full: { width: "100%", height: "80%" },
  caption: { color: "#fff", marginTop: 12, fontSize: 15, textAlign: "center" },
});
