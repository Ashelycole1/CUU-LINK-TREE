import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ButtonStyle } from "@event-tree/api-client";
import { tokens, useTheme } from "../theme";

/**
 * A full-width, centred Linktree-style button in the host's chosen button
 * style. "ticket" is a web-only shape, so it falls back to a pill here.
 */
export function LinkButton({
  label,
  onPress,
  variant,
  accessibilityLabel,
  leading,
  dimmed,
}: {
  label: string;
  onPress: () => void;
  variant: ButtonStyle;
  accessibilityLabel?: string;
  leading?: ReactNode;
  dimmed?: boolean;
}) {
  const theme = useTheme();
  const outline = variant === "outline";
  const shadow = variant === "shadow";
  const fg = outline ? theme.text : theme.cardText;

  return (
    <View style={[styles.wrap, dimmed && { opacity: 0.72 }]}>
      {shadow && <View style={[styles.shadow, { backgroundColor: theme.cardText }]} />}
      <Pressable
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => [
          styles.button,
          shadow ? styles.square : styles.pill,
          outline
            ? { borderWidth: 2, borderColor: theme.text, backgroundColor: pressed ? tokens.glass : "transparent" }
            : { backgroundColor: theme.card },
          shadow && { borderWidth: 2, borderColor: theme.cardText },
          pressed && (shadow ? { transform: [{ translateX: 2 }, { translateY: 2 }] } : { transform: [{ scale: 0.98 }] }),
        ]}
      >
        {leading}
        <Text numberOfLines={2} style={[styles.label, { color: fg }]}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  shadow: { position: "absolute", top: 4, left: 4, right: -4, bottom: -4, borderRadius: 10 },
  button: {
    minHeight: 58,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pill: { borderRadius: tokens.radiusPill },
  square: { borderRadius: 10 },
  label: { fontSize: 16, fontWeight: "600", textAlign: "center", flexShrink: 1 },
});
