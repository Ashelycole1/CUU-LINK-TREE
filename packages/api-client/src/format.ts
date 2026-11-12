import type { EventDTO, EventLinkKind } from "@event-tree/core";

/**
 * Display helpers shared by web and mobile so both apps word dates,
 * countdowns and statuses the same way.
 */
export const Format = {
  dayMonth(iso: string, locale?: string): { day: string; month: string } {
    const d = new Date(iso);
    return {
      day: d.toLocaleDateString(locale, { day: "numeric" }),
      month: d.toLocaleDateString(locale, { month: "short" }).toUpperCase(),
    };
  },

  dateRange(startIso: string, endIso: string, locale?: string): string {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const sameDay = start.toDateString() === end.toDateString();
    const date = start.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    const time = (d: Date) => d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
    if (sameDay) return `${date} · ${time(start)} – ${time(end)}`;
    const endDate = end.toLocaleDateString(locale, { day: "numeric", month: "short" });
    return `${date} ${time(start)} – ${endDate} ${time(end)}`;
  },

  /** "in 3d 4h", "in 2h 10m", "Happening now", "Ended". */
  countdown(event: Pick<EventDTO, "startsAt" | "endsAt">, now = new Date()): string {
    const start = new Date(event.startsAt).getTime();
    const end = new Date(event.endsAt).getTime();
    const t = now.getTime();
    if (t >= end) return "Ended";
    if (t >= start) return "Happening now";
    const mins = Math.floor((start - t) / 60_000);
    const days = Math.floor(mins / 1440);
    const hours = Math.floor((mins % 1440) / 60);
    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${mins % 60}m`;
    return `in ${Math.max(mins, 1)}m`;
  },

  stars(average: number): string {
    const full = Math.round(average);
    return "★".repeat(full) + "☆".repeat(5 - full);
  },

  linkIcon(kind: EventLinkKind): string {
    const icons: Record<EventLinkKind, string> = {
      register: "✍️",
      tickets: "🎟️",
      agenda: "🗓️",
      livestream: "📡",
      slides: "📊",
      photos: "📸",
      recording: "🎬",
      other: "🔗",
    };
    return icons[kind];
  },
};
