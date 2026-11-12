import { Link } from "react-router-dom";
import { Format, type EventDTO } from "@event-tree/api-client";

/**
 * One event as a Linktree-style button: thumbnail on the left, title in the
 * middle, date on the right. The whole row links to the event page.
 */
export function EventButton({ event }: { event: EventDTO }) {
  const { day, month } = Format.dayMonth(event.startsAt);
  return (
    <Link className="event-button" to={`/e/${event.slug}`}>
      <span className="thumb" aria-hidden="true">
        {event.coverImage ? <img src={event.coverImage.url} alt="" loading="lazy" /> : event.emoji}
      </span>
      <span className="event-text">
        <span className="event-title">{event.title}</span>
        <span className="event-meta">
          {event.status === "live" ? (
            <span className="live-tag">● Happening now</span>
          ) : event.status === "past" && event.rating.count > 0 ? (
            <span>
              <span className="stars">{Format.stars(event.rating.average)}</span> {event.rating.average} ({event.rating.count})
            </span>
          ) : (
            event.venue || event.category
          )}
        </span>
      </span>
      <span className="date-chip" aria-label={new Date(event.startsAt).toDateString()}>
        <b>{day}</b>
        {month}
      </span>
    </Link>
  );
}
