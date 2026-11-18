import { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { brand, radius, shadow, space, type, useTheme } from "../theme";

/** Labelled text input used by every mobile form, with optional helper text under it. */
export function Field({ label, hint, ...input }: TextInputProps & { label: string; hint?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#a596b1"
        accessibilityLabel={input.accessibilityLabel ?? label}
        {...input}
        onFocus={(e) => {
          setFocused(true);
          input.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          input.onBlur?.(e);
        }}
        style={[styles.input, focused && styles.inputFocused, input.multiline && styles.multiline]}
      />
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

/**
 * The one button used across forms and the dashboard. "primary" takes the
 * host's accent on their pages and Event Tree pink elsewhere.
 */
export function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = "primary",
  icon,
  style,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const look = {
    primary: { bg: theme.accent, fg: theme.cardText, border: theme.accent },
    secondary: { bg: "transparent", fg: brand.plum, border: brand.plum },
    ghost: { bg: brand.paper2, fg: brand.plum, border: brand.paper2 },
    danger: { bg: brand.dangerBg, fg: brand.danger, border: brand.dangerBg },
  }[variant];
  const off = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: look.bg, borderColor: look.border, opacity: disabled && !loading ? 0.45 : 1 },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.85 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={look.fg} /> : icon}
      <Text style={[styles.buttonText, { color: look.fg }]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

/** Kept for existing screens: a full-width primary button. */
export function PrimaryButton(props: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  return <Button {...props} variant="primary" />;
}

/** White rounded panel that groups related content on Event Tree's own screens. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Small uppercase heading that starts a group of fields or list items. */
export function SectionTitle({ children, color = brand.ink2 }: { children: string; color?: string }) {
  return (
    <Text style={[styles.section, { color }]} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <View style={styles.errorBox} accessibilityRole="alert">
      <Text style={styles.error}>{children}</Text>
    </View>
  );
}

export function NoticeText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <View style={styles.noticeBox} accessibilityLiveRegion="polite">
      <Text style={styles.notice}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "700", color: brand.plum },
  input: {
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: brand.line,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: brand.plum,
    backgroundColor: brand.white,
  },
  inputFocused: { borderColor: brand.blue },
  multiline: { minHeight: 110, textAlignVertical: "top" },
  hint: { ...type.small, color: brand.ink2 },
  button: {
    minHeight: 50,
    borderRadius: radius.pill,
    borderWidth: 2,
    paddingHorizontal: space.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  buttonText: { fontWeight: "800", fontSize: 16 },
  card: { backgroundColor: brand.white, borderRadius: radius.card, borderWidth: 1, borderColor: "rgba(42,15,61,0.06)", padding: space.lg + 4, gap: space.lg, ...shadow.card },
  section: { ...type.section, marginTop: space.md },
  errorBox: { backgroundColor: brand.dangerBg, borderRadius: radius.input, paddingHorizontal: 14, paddingVertical: 10 },
  error: { color: brand.danger, fontWeight: "600", fontSize: 15 },
  noticeBox: { backgroundColor: brand.okBg, borderRadius: radius.input, paddingHorizontal: 14, paddingVertical: 10 },
  notice: { color: brand.ok, fontWeight: "600", fontSize: 15 },
});
