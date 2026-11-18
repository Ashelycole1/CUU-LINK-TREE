import { useState, type ReactNode } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { Icon, categoryIcon, type IconName } from "./Icon";
import { corner, gap, usePalette } from "./palette";

/** Labelled text input on a filled surface, with an optional hint and "optional" tag. */
export function TextField({ label, hint, optional, ...input }: TextInputProps & { label: string; hint?: string; optional?: boolean }) {
  const p = usePalette();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={[s.label, { color: p.text }]}>
        {label}
        {optional && <Text style={{ color: p.textSubtle, fontWeight: "500" }}> optional</Text>}
      </Text>
      <TextInput
        placeholderTextColor={p.textSubtle}
        selectionColor={p.accent}
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
        style={[
          s.input,
          { backgroundColor: p.surface, color: p.text, borderColor: focused ? p.text : "transparent" },
          input.multiline && s.multiline,
        ]}
      />
      {!!hint && <Text style={[s.hint, { color: p.textSubtle }]}>{hint}</Text>}
    </View>
  );
}

/** Pill button: primary is yellow with dark text, secondary is outlined, danger is red text. */
export function Btn({
  title,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  const look =
    variant === "primary"
      ? { bg: p.accent, fg: p.onAccent, border: p.accent }
      : variant === "danger"
        ? { bg: "transparent", fg: p.danger, border: p.danger }
        : { bg: "transparent", fg: p.text, border: p.borderStrong };
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: look.bg, borderColor: look.border, opacity: disabled && !loading ? 0.4 : 1 },
        pressed && { transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={look.fg} /> : icon ? <Icon name={icon} size={18} color={look.fg} /> : null}
      <Text style={[s.btnText, { color: look.fg }]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

/** Small selectable pill: filters, quick picks. Yellow when selected. */
export function Chip({ label, selected, onPress, icon, disabled }: { label: string; selected?: boolean; onPress: () => void; icon?: IconName; disabled?: boolean }) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      hitSlop={4}
      style={({ pressed }) => [
        s.chip,
        { backgroundColor: selected ? p.accent : p.surface, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
      ]}
    >
      {icon && <Icon name={icon} size={14} color={selected ? p.onAccent : p.text} />}
      <Text style={[s.chipText, { color: selected ? p.onAccent : p.text }]}>{label}</Text>
    </Pressable>
  );
}

const TILE_COLOURS = ["#5b4b8a", "#3f6b8c", "#2f7a6b", "#7a5c3e", "#8a4b5e", "#4b5e8a", "#6b6b3f", "#3f5c4b", "#7a4b3e", "#4b4b6b"];

/** The same name-to-colour mapping as the web, so a tile looks identical on both. */
export function hashColour(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TILE_COLOURS[h % TILE_COLOURS.length]!;
}

/** Album-art tile: the poster when there is one, otherwise a colour tile with the category icon. */
export function CoverArt({ uri, name, category, size, radius = corner.sm }: { uri?: string | null; name: string; category?: string | null; size: number | "fill"; radius?: number }) {
  const box = size === "fill" ? { width: "100%" as const, height: "100%" as const } : { width: size, height: size };
  return (
    <View style={{ ...box, borderRadius: radius, overflow: "hidden", backgroundColor: uri ? "#242424" : hashColour(name), alignItems: "center", justifyContent: "center" }}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <Icon name={categoryIcon(category)} size={size === "fill" ? 56 : Math.round(size * 0.4)} color="#ffffff" />
      )}
    </View>
  );
}

/** A numbered step heading. The number turns yellow while you are in that step. */
export function StepHead({ n, title, optional, active }: { n: number; title: string; optional?: boolean; active?: boolean }) {
  const p = usePalette();
  return (
    <View style={s.stepHead} accessibilityRole="header">
      <View style={[s.stepN, { backgroundColor: active ? p.accent : p.surfaceHigh }]}>
        <Text style={[s.stepNText, { color: active ? p.onAccent : p.text }]}>{n}</Text>
      </View>
      <Text style={[s.stepTitle, { color: p.text }]}>
        {title}
        {optional && <Text style={{ color: p.textSubtle, fontWeight: "500", fontSize: 14 }}> optional</Text>}
      </Text>
    </View>
  );
}

export function InlineError({ children }: { children?: string | null }) {
  const p = usePalette();
  if (!children) return null;
  return (
    <View style={[s.error, { backgroundColor: p.dangerBg }]} accessibilityRole="alert">
      <Text style={{ color: p.danger, fontWeight: "600", fontSize: 15 }}>{children}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: "row", flexWrap: "wrap", gap: gap.sm }, style]}>{children}</View>;
}

const s = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "700" },
  input: { minHeight: 48, borderRadius: corner.md, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  multiline: { minHeight: 104, textAlignVertical: "top" },
  hint: { fontSize: 13, lineHeight: 18 },
  btn: { minHeight: 48, borderRadius: corner.pill, borderWidth: 1.5, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnText: { fontSize: 16, fontWeight: "800" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderRadius: corner.pill },
  chipText: { fontSize: 14, fontWeight: "600" },
  stepHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepN: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepNText: { fontSize: 13, fontWeight: "800" },
  stepTitle: { fontSize: 18, fontWeight: "800" },
  error: { borderRadius: corner.md, paddingHorizontal: 14, paddingVertical: 10 },
});
