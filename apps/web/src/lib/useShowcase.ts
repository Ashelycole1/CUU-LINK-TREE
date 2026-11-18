import { useEffect, useState } from "react";
import type { CommunityDTO, CommunityEventDTO } from "@event-tree/api-client";
import { samplePage } from "../content/samplePage";
import { api } from "./api";

/** How often the marketing pages re-check what's on, so new, live and finished events show without a reload. */
const REFRESH_MS = 60_000;

export interface Showcase {
  /** Events to show: live ones first, then soonest. Real ones once loaded. */
  events: CommunityEventDTO[];
  /** True once `events` are real events from Event Tree pages. */
  real: boolean;
  /** Every registered page, busiest first (empty until loaded). */
  pages: CommunityDTO["pages"];
  /** Every event ever posted and every registered page, or null until loaded. */
  totals: CommunityDTO["totals"] | null;
}

/** The built-in sample events, shown only while loading or if no host has upcoming events yet. */
function sampleEvents(): CommunityEventDTO[] {
  const tree = samplePage();
  const p = tree.profile;
  const host = { username: p.username, displayName: p.displayName, avatarUrl: p.avatarUrl, color: p.appearance.colors.background };
  return tree.upcoming.map((event) => ({ event, host }));
}

/**
 * Real content for Event Tree's own pages (landing, log in, sign up). It
 * re-checks every minute and whenever the tab comes back into view, so
 * events appear, go live and drop off as they happen.
 */
export function useShowcase(): Showcase {
  const [state, setState] = useState<Showcase>(() => ({ events: sampleEvents(), real: false, pages: [], totals: null }));

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .getCommunity({ limit: 24 })
        .then(({ events, pages, totals }) => {
          if (!alive) return;
          const live = events.filter((x) => x.event.status === "live");
          const ordered = [...live, ...events.filter((x) => x.event.status !== "live")];
          setState((s) => ({
            events: ordered.length > 0 ? ordered : s.real ? [] : s.events,
            real: ordered.length > 0 || s.real,
            pages: pages ?? [],
            totals: totals ?? null,
          }));
        })
        .catch(() => undefined); // Keep what's shown: marketing pages must never break because the feed is down.

    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return state;
}
