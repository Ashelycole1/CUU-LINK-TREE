import { useId, useState } from "react";
import { Link } from "react-router-dom";
import type { EventDTO, TreeDTO } from "@event-tree/api-client";
import { appearanceStyle } from "../../theme/appearance";
import { EventTicket } from "./EventTicket";
import { ProfileHeader } from "./ProfileHeader";

interface Props {
  tree: TreeDTO;
  /** Called when a visitor opens an event (for click analytics). */
  onOpen?: (event: EventDTO) => void;
  /** A non-interactive picture of a page (the landing sample): links are inert and the height follows the content. */
  preview?: boolean;
}

/**
 * A host's whole public page, rendered from one TreeDTO and laid out like
 * Linktree: avatar, name, bio, socials, then one button per upcoming event.
 * Past events sit behind a toggle at the end. Used by the public route and
 * by the dashboard preview, so both always look identical.
 */
export function TreeView({ tree, onOpen, preview = false }: Props) {
  const { profile } = tree;
  const [showPast, setShowPast] = useState(false);
  const pastId = useId();

  const button = (e: EventDTO) => (
    <EventTicket key={e.id} event={e} username={profile.username} buttonStyle={profile.appearance.buttonStyle} onOpen={onOpen} />
  );

  return (
    <div
      className={`tree tree--${profile.appearance.buttonStyle}${preview ? " tree--preview" : ""}`}
      style={appearanceStyle(profile.appearance)}
      inert={preview}
    >
      <main className="tree-column">
        <ProfileHeader profile={profile} />

        <section className="ticket-list" aria-label="Upcoming events">
          {tree.upcoming.map(button)}
          {tree.upcoming.length === 0 && (
            <p className="tree-empty">{tree.past.length === 0 ? "No events yet. Check back soon." : "No upcoming events yet."}</p>
          )}
        </section>

        {tree.past.length > 0 && (
          <section className="past">
            <button
              type="button"
              className="past-toggle"
              aria-expanded={showPast}
              aria-controls={pastId}
              onClick={() => setShowPast((v) => !v)}
            >
              {showPast ? "Hide past events" : `Past events (${tree.past.length})`}
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div id={pastId} className="ticket-list is-past" hidden={!showPast}>
              {showPast && tree.past.map(button)}
            </div>
          </section>
        )}

        <footer className="tree-footer">
          <Link to="/" className="made-with">
            Make your own Event Tree
          </Link>
        </footer>
      </main>
    </div>
  );
}
