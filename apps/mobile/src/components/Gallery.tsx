import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError, type EventDTO, type ImageLinkDTO } from "@event-tree/api-client";
import { api } from "../lib/api";
import { IMAGE_SIZES, pickImage } from "../lib/pickImage";
import { tokens } from "../theme";
import { ErrorText, Field, PrimaryButton } from "./Field";

interface Props {
  event: EventDTO;
  onUpdated: (event: EventDTO) => void;
}

/** Three-column photo grid with a full-screen viewer, and a button to add your own photo. */
export function Gallery({ event, onUpdated }: Props) {
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
        <Text style={styles.note}>No photos yet. Were you there? Add yours below.</Text>
      ) : (
        <View style={styles.grid}>
          {event.gallery.map((img) => (
            <Pressable key={img.url} style={styles.cell} onPress={() => setOpen(img)} accessibilityLabel={img.alt || "Open photo"}>
              <Image source={{ uri: img.url }} style={StyleSheet.absoluteFill} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.addCard}>
        <Field label="Caption (optional)" value={caption} onChangeText={setCaption} maxLength={200} />
        <ErrorText>{error}</ErrorText>
        <PrimaryButton title={busy ? "Uploading…" : "Choose a photo"} onPress={add} disabled={busy} />
      </View>

      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable style={styles.viewer} onPress={() => setOpen(null)}>
          {open && <Image source={{ uri: open.url }} style={styles.full} resizeMode="contain" />}
          {!!open?.caption && <Text style={styles.caption}>{open.caption}</Text>}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { color: tokens.muted, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cell: { width: "32%", aspectRatio: 1, borderRadius: 12, overflow: "hidden", backgroundColor: tokens.glass },
  addCard: { backgroundColor: "#fff", borderRadius: tokens.radiusCard, padding: 16, gap: 10 },
  viewer: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center", padding: 16 },
  full: { width: "100%", height: "80%" },
  caption: { color: "#fff", marginTop: 12 },
});
