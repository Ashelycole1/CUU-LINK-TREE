import { Format, type EventDTO } from "@event-tree/api-client";
import { Icon } from "./Icon";

interface Props {
  event: EventDTO;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS: Record<EventDTO["status"], string> = { upcoming: "Upcoming", live: "Live now", past: "Past" };

/**
 * One event in the dashboard list: reorder arrows, title and date, a
 * show/hide switch, edit and delete. Like a link card in Linktree's editor.
 */
export function EventCard({ event, isFirst, isLast, onMove, onToggle, onEdit, onDelete }: Props) {
  return (
    <article className={`event-card${event.hidden ? " is-hidden" : ""}`}>
      <div className="reorder" aria-label="Reorder">
        <button type="button" className="icon-btn" onClick={() => onMove(-1)} disabled={isFirst} aria-label={`Move ${event.title} up`}>
          <Icon name="up" size={16} />
        </button>
        <button type="button" className="icon-btn" onClick={() => onMove(1)} disabled={isLast} aria-label={`Move ${event.title} down`}>
          <Icon name="down" size={16} />
        </button>
      </div>

      <div className="event-card-thumb" aria-hidden="true">
        {event.coverImage ? <img src={event.coverImage.url} alt="" /> : event.emoji}
      </div>

      <button type="button" className="event-card-body" onClick={onEdit}>
        <b>{event.title}</b>
        <span>
          {Format.dateRange(event.startsAt, event.endsAt)}
        </span>
        <span className="event-card-tags">
          <span className={`tag tag--${event.status}`}>{STATUS[event.status]}</span>
          <span className="tag">{event.category}</span>
          {event.rating.count > 0 && <span className="tag">★ {event.rating.average} ({event.rating.count})</span>}
          {event.gallery.length > 0 && <span className="tag">{event.gallery.length} photos</span>}
        </span>
      </button>

      <div className="event-card-actions">
        <label className="switch-toggle" title={event.hidden ? "Hidden from your page" : "Shown on your page"}>
          <input type="checkbox" checked={!event.hidden} onChange={onToggle} aria-label={`Show ${event.title} on your page`} />
          <span aria-hidden="true" />
        </label>
        <button type="button" className="icon-btn" onClick={onEdit} aria-label={`Edit ${event.title}`}>
          <Icon name="edit" />
        </button>
        <button type="button" className="icon-btn danger" onClick={onDelete} aria-label={`Delete ${event.title}`}>
          <Icon name="trash" />
        </button>
      </div>
    </article>
  );
}
