import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { EventDTO } from "@event-tree/api-client";
import { Icon } from "./Icon";
import { corner, usePalette } from "./palette";

type Phase = EventDTO["status"];

const STEPS: { phase: Phase; label: string; hint: (e: EventDTO) => string }[] = [
  { phase: "upcoming", label: "Announced", hint: () => "Get tickets and save the date" },
  { phase: "live", label: "Doors open", hint: () => "Happening now" },
  {
    phase: "past",
    label: "Afterwards",
    hint: (e) => (e.rating.count > 0 ? `${e.rating.count} review${e.rating.count === 1 ? "" : "s"}, ${e.gallery.length} photos` : "Photos and reviews"),
  },
];

/**
 * Where the event is in its life: announced, doors open, afterwards. The
 * current step is yellow, steps behind it are ticked, steps ahead are quiet.
 */
export function PhaseRail({ event }: { event: EventDTO }) {
  const p = usePalette();
  const current = STEPS.findIndex((s) => s.phase === event.status);
  return (
    <View style={s.rail} accessibilityRole="list" accessibilityLabel="Where this event is">
      {STEPS.map((step, i) => {
        const state = i < current ? "done" : i === current ? "now" : "next";
        return (
          <View key={step.phase} style={s.step} accessibilityLabel={`${step.label}${state === "now" ? ", now" : state === "done" ? ", done" : ""}`}>
            <View style={s.track}>
              <View style={[s.line, { backgroundColor: i === 0 ? "transparent" : i <= current ? p.accent : p.border }]} />
              <View
                style={[
                  s.dot,
                  state === "now" && { backgroundColor: p.accent, borderColor: p.accent, width: 22, height: 22, borderRadius: 11 },
                  state === "done" && { backgroundColor: p.accent, borderColor: p.accent },
                  state === "next" && { backgroundColor: p.bg, borderColor: p.borderStrong },
                ]}
              >
                {state === "done" && <Icon name="check" size={12} color={p.onAccent} strokeWidth={3} />}
                {state === "now" && step.phase === "live" && <View style={[s.pip, { backgroundColor: p.onAccent }]} />}
              </View>
              <View style={[s.line, { backgroundColor: i === STEPS.length - 1 ? "transparent" : i < current ? p.accent : p.border }]} />
            </View>
            <Text style={[s.label, { color: state === "next" ? p.textSubtle : p.text }]}>{step.label}</Text>
            {state === "now" && (
              <Text style={[s.hint, { color: p.textMuted }]} numberOfLines={2}>
                {step.hint(event)}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function parts(ms: number) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(sec / 86400), h: Math.floor((sec % 86400) / 3600), m: Math.floor((sec % 3600) / 60), s: sec % 60 };
}

/** A live countdown to the start (or to the end while the event is on). Ticks every second. */
export function Countdown({ event }: { event: EventDTO }) {
  const p = usePalette();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const live = event.status === "live";
  const t = parts(new Date(live ? event.endsAt : event.startsAt).getTime() - now);
  const cells = [
    { v: t.d, l: t.d === 1 ? "day" : "days" },
    { v: t.h, l: t.h === 1 ? "hour" : "hours" },
    { v: t.m, l: "min" },
    { v: t.s, l: "sec" },
  ];
  return (
    <View style={{ gap: 10 }} accessibilityRole="timer" accessibilityLabel={`${live ? "Ends in" : "Starts in"} ${t.d} days, ${t.h} hours and ${t.m} minutes`}>
      <Text style={[s.cdLabel, { color: p.textMuted }]}>{live ? "Ends in" : "Starts in"}</Text>
      <View style={s.cells}>
        {cells.map((c) => (
          <View key={c.l} style={[s.cell, { backgroundColor: p.surface }]}>
            <Text style={[s.cellNum, { color: p.text }]}>{String(c.v).padStart(2, "0")}</Text>
            <Text style={[s.cellUnit, { color: p.textSubtle }]}>{c.l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  rail: { flexDirection: "row" },
  step: { flex: 1, alignItems: "center", gap: 6 },
  track: { flexDirection: "row", alignItems: "center", alignSelf: "stretch", height: 22 },
  line: { flex: 1, height: 2 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  pip: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 14, fontWeight: "800", textAlign: "center" },
  hint: { fontSize: 12, textAlign: "center", paddingHorizontal: 4 },
  cdLabel: { fontSize: 13, fontWeight: "700" },
  cells: { flexDirection: "row", gap: 8 },
  cell: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: corner.md },
  cellNum: { fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] },
  cellUnit: { fontSize: 12, fontWeight: "600" },
});
