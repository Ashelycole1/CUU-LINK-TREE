import type { Palette } from "./palette";

/** Short, human date words; the same wording as the web (apps/web/src/lib/dates.ts). */

export const dayNumber = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric" });
export const monthShort = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short" });
export const weekdayShort = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
export const timeShort = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/** "Sat 22 Nov · 8:00 PM" */
export function whenLine(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · ${timeShort(iso)}`;
}

/** "Starts in 8 days", "Starts tomorrow", "Starts in 3 hours", "Happening now", "Ended". */
export function startsIn(startIso: string, endIso: string, now = Date.now()): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (now >= end) return "Ended";
  if (now >= start) return "Happening now";
  const hours = Math.round((start - now) / 3_600_000);
  if (hours < 1) return "Starts within the hour";
  if (hours < 24) return `Starts in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Starts tomorrow" : `Starts in ${days} days`;
}

function rgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const n = parseInt(h.slice(0, 6), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * The host's colour pulled toward the app background, like the web's
 * headerTint(): dark keeps 72% of the host colour over #121212, light keeps
 * 26% over white, so header text always reads.
 */
export function headerTint(hex: string, p: Palette): string {
  const [r, g, b] = rgb(hex);
  const [br, bg, bb] = p.scheme === "dark" ? [18, 18, 18] : [255, 255, 255];
  const k = p.scheme === "dark" ? 0.72 : 0.26;
  const mix = (a: number, z: number) => Math.round(a * k + z * (1 - k));
  return `rgb(${mix(r, br)},${mix(g, bg)},${mix(b, bb)})`;
}
