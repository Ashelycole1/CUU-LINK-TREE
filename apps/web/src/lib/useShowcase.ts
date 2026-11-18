import { useEffect, useState } from "react";
import type { CommunityEventDTO, TreeDTO } from "@event-tree/api-client";
import { samplePage } from "../content/samplePage";
import { api } from "./api";

export interface Showcase {
  /** The page shown in the browser-window preview: a real host's page, or the built-in sample until one loads. */
  tree: TreeDTO;
  /** True once `tree` is a real host's page. */
  real: boolean;
  /** Real upcoming events from every page: live ones first, then soonest. */
  events: CommunityEventDTO[];
}

/**
 * Real content for Event Tree's own pages (landing, log in, sign up). It
 * features the host whose event is on right now, or the next one coming up.
 * The sample page only shows while loading or if no host has events yet.
 */
export function useShowcase(): Showcase {
  const [state, setState] = useState<Showcase>(() => ({ tree: samplePage(), real: false, events: [] }));

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { events } = await api.getCommunity({ limit: 24 });
        const ordered = [...events.filter((x) => x.event.status === "live"), ...events.filter((x) => x.event.status !== "live")];
        if (!alive || ordered.length === 0) return;
        setState((s) => ({ ...s, events: ordered }));
        const tree = await api.getPage(ordered[0]!.host.username);
        if (alive) setState({ tree, real: true, events: ordered });
      } catch {
        // Keep the sample: the marketing pages must never break because the feed is down.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
