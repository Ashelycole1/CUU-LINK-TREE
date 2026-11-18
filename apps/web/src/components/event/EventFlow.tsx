import { useEffect, useState } from "react";
import type { EventDTO } from "@event-tree/api-client";
import { Icon } from "../ui/Icon";

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
 * current step is filled; steps behind it are ticked; steps ahead are quiet.
 */
export function PhaseRail({ event }: { event: EventDTO }) {
  const current = STEPS.findIndex((s) => s.phase === event.status);
  return (
    <ol className="phase-rail" aria-label="Where this event is">
      {STEPS.map((s, i) => {
        const state = i < current ? "done" : i === current ? "now" : "next";
        return (
          <li key={s.phase} className={`phase is-${state}`} aria-current={state === "now" ? "step" : undefined}>
            <span className="phase-dot" aria-hidden="true">
              {state === "done" ? <Icon name="check" size={14} /> : state === "now" && s.phase === "live" ? <span className="live-pip" /> : null}
            </span>
            <span className="phase-text">
              <b>{s.label}</b>
              {state === "now" && <span>{s.hint(event)}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** A live countdown to the start (or to the end while the event is on). Ticks every second. */
export function Countdown({ event }: { event: EventDTO }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const live = event.status === "live";
  const target = new Date(live ? event.endsAt : event.startsAt).getTime();
  const t = parts(target - now);
  const cells = [
    { v: t.d, l: t.d === 1 ? "day" : "days" },
    { v: t.h, l: t.h === 1 ? "hour" : "hours" },
    { v: t.m, l: "min" },
    { v: t.s, l: "sec" },
  ];
  return (
    <div className="countdown-block" role="timer" aria-label={live ? "Time until it ends" : "Time until it starts"}>
      <p className="countdown-label">{live ? "Ends in" : "Starts in"}</p>
      <div className="countdown-cells" aria-hidden="true">
        {cells.map((c) => (
          <span key={c.l} className="countdown-cell">
            <b>{String(c.v).padStart(2, "0")}</b>
            <span>{c.l}</span>
          </span>
        ))}
      </div>
      <span className="sr-only">
        {t.d} days, {t.h} hours and {t.m} minutes
      </span>
    </div>
  );
}

/** Builds an .ics file in the browser so visitors can save the event to any calendar app. */
export function calendarFile(event: EventDTO, pageUrl: string): string {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (v: string) => v.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Event Tree//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@eventtree`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.startsAt)}`,
    `DTEND:${stamp(event.endsAt)}`,
    `SUMMARY:${esc(event.title)}`,
    event.venue ? `LOCATION:${esc(event.venue)}` : "",
    `DESCRIPTION:${esc([event.description, pageUrl].filter(Boolean).join("\n\n"))}`,
    `URL:${pageUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
  return URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
}
