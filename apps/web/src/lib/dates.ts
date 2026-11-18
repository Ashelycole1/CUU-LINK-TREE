/** Short, human date words used across the web app. */

export function dayNumber(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric" });
}

export function monthShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short" });
}

export function weekdayShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
}

/** "Sat 22 Nov · 8:00 PM" */
export function whenLine(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
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
  if (days === 1) return "Starts tomorrow";
  return `Starts in ${days} days`;
}

/** Pulls the host colour toward the theme background (dark or light) so header text always reads. */
export function headerTint(hex: string): string {
  return `color-mix(in srgb, ${hex} var(--tint-amount), var(--tint-base))`;
}
