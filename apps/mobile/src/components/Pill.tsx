import { Pressable, StyleSheet, Text, View } from "react-native";
import { tokens, useTheme } from "../theme";

interface SwitchProps<T extends string> {
  options: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}

/** The 48px pill switch (Upcoming / Past). */
export function PillSwitch<T extends string>({ options, value, onChange }: SwitchProps<T>) {
  return (
    <View style={styles.switch} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            style={[styles.tab, selected && styles.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.tabText, selected && { color: "#000" }]}>
              {o.label}
              {o.count !== undefined && <Text style={styles.count}>  {o.count}</Text>}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A category chip. */
export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: theme.accent }]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      <Text style={[styles.chipText, active && { color: theme.background }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  switch: { flexDirection: "row", alignSelf: "center", padding: 3, borderRadius: tokens.radiusPill, backgroundColor: "rgba(0,0,0,0.36)", marginTop: 28 },
  tab: { height: 48, minWidth: 97, paddingHorizontal: 24, borderRadius: tokens.radiusPill, alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: "#fff" },
  tabText: { color: "#fff", fontWeight: "500", fontSize: 14 },
  count: { fontSize: 12, opacity: 0.6 },
  chip: { height: 32, paddingHorizontal: 14, borderRadius: tokens.radiusPill, backgroundColor: tokens.glass, justifyContent: "center", marginRight: 8 },
  chipText: { color: "#fff", fontSize: 13, fontWeight: "500" },
});
