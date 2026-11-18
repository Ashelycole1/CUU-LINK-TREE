import { useEffect, useState } from "react";
import type { CommunityEventDTO } from "@event-tree/api-client";
import { samplePage } from "../content/samplePage";
import { api } from "./api";

export interface Showcase {
  /** Events to show: live ones first, then soonest. Real ones once loaded. */
  events: CommunityEventDTO[];
  /** True once `events` are real events from Event Tree pages. */
  real: boolean;
}

/** The built-in sample events, shown only while loading or if no host has upcoming events yet. */
function sampleEvents(): CommunityEventDTO[] {
  const tree = samplePage();
  const p = tree.profile;
  const host = { username: p.username, displayName: p.displayName, avatarUrl: p.avatarUrl, color: p.appearance.colors.background };
  return tree.upcoming.map((event) => ({ event, host }));
}

/** Real upcoming events from every page, for Event Tree's own pages (landing, log in, sign up). */
export function useShowcase(): Showcase {
  const [state, setState] = useState<Showcase>(() => ({ events: sampleEvents(), real: false }));

  useEffect(() => {
    let alive = true;
    api
      .getCommunity({ limit: 24 })
      .then(({ events }) => {
        if (!alive || events.length === 0) return;
        const live = events.filter((x) => x.event.status === "live");
        setState({ events: [...live, ...events.filter((x) => x.event.status !== "live")], real: true });
      })
      .catch(() => undefined); // Keep the sample: marketing pages must never break because the feed is down.
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
