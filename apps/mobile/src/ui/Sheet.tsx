import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "./Icon";
import { corner, usePalette } from "./palette";

export interface SheetAction {
  label: string;
  icon: IconName;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/** A bottom sheet of actions for one item, in thumb reach. Tapping outside closes it. */
export function ActionSheet({ title, actions, onClose }: { title: string | null; actions: SheetAction[]; onClose: () => void }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!title} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      <View style={[s.sheet, { backgroundColor: p.bgElevated, paddingBottom: 12 + insets.bottom }]}>
        <View style={[s.grip, { backgroundColor: p.borderStrong }]} />
        <Text style={[s.title, { color: p.text }]} numberOfLines={1}>
          {title}
        </Text>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            disabled={a.disabled}
            onPress={() => {
              onClose();
              a.onPress();
            }}
            accessibilityRole="button"
            style={({ pressed }) => [s.row, { opacity: a.disabled ? 0.35 : 1, backgroundColor: pressed ? p.surface : "transparent" }]}
          >
            <Icon name={a.icon} size={20} color={a.danger ? p.danger : p.textMuted} />
            <Text style={[s.rowText, { color: a.danger ? p.danger : p.text }]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 8, paddingTop: 8 },
  grip: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: "800", paddingHorizontal: 16, paddingVertical: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 16, minHeight: 52, paddingHorizontal: 16, borderRadius: corner.md },
  rowText: { fontSize: 16, fontWeight: "600" },
});
