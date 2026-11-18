import type { EventDTO } from "@event-tree/api-client";
import { dayNumber, monthShort, whenLine } from "../../lib/dates";
import { CoverArt, Menu, Stars } from "../ui";

interface Props {
  event: EventDTO;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS: Record<EventDTO["status"], string> = { upcoming: "Upcoming", live: "Live now", past: "Past" };

/**
 * One event in the dashboard track list: position, artwork and title, when,
 * status, a show/hide switch and a menu for edit, reorder and delete.
 */
export function EventCard({ event, index, isFirst, isLast, onMove, onToggle, onEdit, onDelete }: Props) {
  return (
    <div className={`ev-row is-${event.status}${event.hidden ? " is-hidden" : ""}`} role="row">
      <span className="ev-index" role="cell">
        {index + 1}
      </span>

      <button type="button" className="ev-main" role="cell" onClick={onEdit} aria-label={`Edit ${event.title}`}>
        <CoverArt src={event.coverImage?.url} name={event.title} category={event.category} size={48} />
        <span className="ev-text">
          <b>{event.title}</b>
          <span>
            {event.status === "past" && event.rating.count > 0 ? (
              <>
                <Stars value={event.rating.average} size={12} /> {event.rating.average.toFixed(1)}, {event.rating.count} review
                {event.rating.count === 1 ? "" : "s"}
              </>
            ) : (
              event.venue || event.category
            )}
          </span>
        </span>
      </button>

      <span className="ev-when" role="cell">
        <span className="ev-date" aria-hidden="true">
          <b>{dayNumber(event.startsAt)}</b> {monthShort(event.startsAt)}
        </span>
        <span className="ev-when-full">{whenLine(event.startsAt)}</span>
      </span>

      <span className="ev-status" role="cell">
        {event.hidden ? <span className="ev-pill is-hidden">Hidden</span> : <span className={`ev-pill is-${event.status}`}>{STATUS[event.status]}</span>}
      </span>

      <span className="ev-actions" role="cell">
        <label className="switch-toggle" title={event.hidden ? "Hidden from your page" : "Shown on your page"}>
          <input type="checkbox" checked={!event.hidden} onChange={onToggle} aria-label={`Show ${event.title} on your page`} />
          <span aria-hidden="true" />
        </label>
        <Menu
          label={`More for ${event.title}`}
          items={[
            { label: "Edit", icon: "edit", onSelect: onEdit },
            { label: "Move up", icon: "up", onSelect: () => onMove(-1), disabled: isFirst },
            { label: "Move down", icon: "down", onSelect: () => onMove(1), disabled: isLast },
            { label: "Delete", icon: "trash", onSelect: onDelete, danger: true },
          ]}
        />
      </span>
    </div>
  );
}
