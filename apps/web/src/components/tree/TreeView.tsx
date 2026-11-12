import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { EventDTO, TreeDTO } from "@event-tree/api-client";
import { BrowserStore } from "../../lib/BrowserStore";
import { appearanceStyle } from "../../theme/appearance";
import { EventTicket } from "./EventTicket";
import { Filters } from "./Filters";
import { NextUpCard } from "./NextUpCard";
import { ProfileHeader } from "./ProfileHeader";
import { StatusTabs, type Tab } from "./StatusTabs";

const tabStore = new BrowserStore<Tab>("event-tree:tab", "upcoming", "session");

interface Props {
  tree: TreeDTO;
  /** Called when a visitor opens an event (for click analytics). */
  onOpen?: (event: EventDTO) => void;
}

/**
 * A host's whole public page, rendered from one TreeDTO. Used by the public
 * route and by the dashboard preview, so both always look identical.
 */
export function TreeView({ tree, onOpen }: Props) {
  const { profile } = tree;
  const [tab, setTab] = useState<Tab>(() => tabStore.get());
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");

  // The page already has every visible event, so filtering locally keeps typing instant.
  const visible = useMemo(() => {
    const source = tab === "upcoming" ? tree.upcoming : tree.past;
    const q = query.trim().toLowerCase();
    return source.filter(
      (e) =>
        (!category || e.category === category) &&
        (!q || [e.title, e.description, e.venue, e.organizer, e.category].some((v) => v.toLowerCase().includes(q))),
    );
  }, [tab, tree, category, query]);

  const changeTab = (next: Tab) => {
    tabStore.set(next);
    setTab(next);
  };

  return (
    <div className={`tree tree--${profile.appearance.buttonStyle}`} style={appearanceStyle(profile.appearance)}>
      <main className="tree-column">
        <ProfileHeader profile={profile} upcomingCount={tree.upcoming.length} />

        {tree.upcoming.length > 0 && (
          <section aria-label="Next up">
            <h2 className="tree-head">Next up</h2>
            <div className="next-row">
              {tree.upcoming.slice(0, 3).map((e) => (
                <NextUpCard key={e.id} event={e} username={profile.username} onOpen={onOpen} />
              ))}
            </div>
          </section>
        )}

        <StatusTabs value={tab} onChange={changeTab} counts={{ upcoming: tree.upcoming.length, past: tree.past.length }} />
        <Filters query={query} onQuery={setQuery} categories={tree.categories} category={category} onCategory={setCategory} />

        <section className="ticket-list" aria-live="polite">
          {visible.length === 0 && (
            <p className="tree-empty">
              {tree.upcoming.length + tree.past.length === 0
                ? "No events yet. Check back soon."
                : tab === "upcoming"
                  ? "Nothing coming up that matches."
                  : "No past events match."}
            </p>
          )}
          {visible.map((e) => (
            <EventTicket key={e.id} event={e} username={profile.username} buttonStyle={profile.appearance.buttonStyle} onOpen={onOpen} />
          ))}
        </section>

        <footer className="tree-footer">
          <Link to="/" className="made-with">
            Make your own Event Tree
          </Link>
        </footer>
      </main>
    </div>
  );
}
