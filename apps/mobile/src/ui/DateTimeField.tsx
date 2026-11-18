import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Icon } from "./Icon";
import { corner, usePalette } from "./palette";

type Mode = "date" | "time";

const dateLabel = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const timeLabel = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/**
 * A date and a time as two tappable pills. Android opens the system dialogs;
 * iOS opens a wheel under the field with a Done button. Nothing to type.
 */
export function DateTimeField({
  label,
  value,
  onChange,
  minimumDate,
  placeholder = "Pick a date",
}: {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  minimumDate?: Date;
  placeholder?: string;
}) {
  const p = usePalette();
  const [open, setOpen] = useState<Mode | null>(null);
  const current = value ?? defaultStart(minimumDate);

  function pick(mode: Mode) {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode,
        minimumDate: mode === "date" ? minimumDate : undefined,
        onValueChange: (_e, d) => onChange(merge(current, d, mode)),
      });
      return;
    }
    setOpen(open === mode ? null : mode);
  }

  const pill = (mode: Mode, text: string, empty: boolean) => (
    <Pressable
      onPress={() => pick(mode)}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${mode}: ${empty ? "not set" : text}`}
      style={({ pressed }) => [
        s.pill,
        { backgroundColor: p.surface, borderColor: open === mode ? p.text : "transparent", opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Icon name={mode === "date" ? "calendar" : "clock"} size={16} color={p.textMuted} />
      <Text style={[s.pillText, { color: empty ? p.textSubtle : p.text }]}>{text}</Text>
    </Pressable>
  );

  return (
    <View style={{ gap: 8 }}>
      <Text style={[s.label, { color: p.text }]}>{label}</Text>
      <View style={s.row}>
        {pill("date", value ? dateLabel(value) : placeholder, !value)}
        {pill("time", value ? timeLabel(value) : "Time", !value)}
      </View>
      {open && Platform.OS === "ios" && (
        <View style={[s.wheel, { backgroundColor: p.bgElevated, borderColor: p.border }]}>
          <DateTimePicker
            value={current}
            mode={open}
            display="spinner"
            themeVariant={p.scheme}
            minimumDate={open === "date" ? minimumDate : undefined}
            onValueChange={(_e, d) => onChange(merge(current, d, open))}
          />
          <Pressable onPress={() => setOpen(null)} accessibilityRole="button" style={s.done} hitSlop={8}>
            <Text style={{ color: p.accentInk, fontWeight: "800", fontSize: 16 }}>Done</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/** Keeps the time when the date changes, and the date when the time changes. */
function merge(base: Date, picked: Date, mode: Mode): Date {
  const next = new Date(base);
  if (mode === "date") next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  else next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return next;
}

/** Tomorrow at 7pm, a sensible first guess for an event. */
function defaultStart(min?: Date): Date {
  if (min) return new Date(min);
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(19, 0, 0, 0);
  return d;
}

const s = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8 },
  pill: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, paddingHorizontal: 14, borderRadius: corner.md, borderWidth: 2 },
  pillText: { fontSize: 16, fontWeight: "600" },
  wheel: { borderRadius: corner.lg, borderWidth: 1, paddingBottom: 8 },
  done: { alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 8 },
});
