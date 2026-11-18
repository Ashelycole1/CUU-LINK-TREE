import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError, type EventDTO, type ImageLinkDTO } from "@event-tree/api-client";
import { api } from "../lib/api";
import { IMAGE_SIZES, pickImage } from "../lib/pickImage";
import { brand, onBackground, radius, space, useTheme } from "../theme";
import { Button, ErrorText, Field } from "./Field";

interface Props {
  event: EventDTO;
  onUpdated: (event: EventDTO) => void;
}

/** Three-column photo grid with a full-screen viewer, and a button to add your own photo. */
export function Gallery({ event, onUpdated }: Props) {
  const c = onBackground(useTheme());
  const [open, setOpen] = useState<ImageLinkDTO | null>(null);
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
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not add that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 12 }}>
      {event.gallery.length === 0 ? (
        <Text style={[styles.note, { color: c.muted }]}>No photos yet. Were you there? Add yours below.</Text>
      ) : (
        <View style={styles.grid}>
          {event.gallery.map((img) => (
            <Pressable key={img.url} style={[styles.cell, { backgroundColor: c.surface }]} onPress={() => setOpen(img)} accessibilityLabel={img.alt || "Open photo"}>
              <Image source={{ uri: img.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.addCard}>
        <Text style={styles.addTitle}>Add your photo</Text>
        <Field label="Caption (optional)" value={caption} onChangeText={setCaption} maxLength={200} placeholder="Say something about it" />
        <ErrorText>{error}</ErrorText>
        <Button title={busy ? "Uploading…" : "Choose a photo"} onPress={add} loading={busy} />
      </View>

      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable style={styles.viewer} onPress={() => setOpen(null)} accessibilityRole="button" accessibilityLabel="Close photo">
          {open && <Image source={{ uri: open.url }} style={styles.full} resizeMode="contain" />}
          {!!open?.caption && <Text style={styles.caption}>{open.caption}</Text>}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { textAlign: "center", fontSize: 15 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cell: { width: "32%", aspectRatio: 1, borderRadius: 12, overflow: "hidden" },
  addCard: { backgroundColor: brand.white, borderRadius: radius.card, padding: space.lg + 2, gap: space.md },
  addTitle: { fontSize: 17, fontWeight: "800", color: brand.plum },
  viewer: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center", padding: space.lg },
  full: { width: "100%", height: "80%" },
  caption: { color: "#fff", marginTop: space.md, fontSize: 15, textAlign: "center" },
});
