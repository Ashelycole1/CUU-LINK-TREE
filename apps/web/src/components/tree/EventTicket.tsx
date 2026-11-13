import { Link } from "react-router-dom";
import { Format, type ButtonStyle, type EventDTO } from "@event-tree/api-client";

interface Props {
  event: EventDTO;
  username: string;
  buttonStyle: ButtonStyle;
  onOpen?: (event: EventDTO) => void;
}

const weekday = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

/**
 * One event on a public page: a full-width Linktree-style button with the
 * title centred and a thumbnail on the left. In the house "ticket" style the
 * right end is a perforated stub with the date; the other styles (pill,
 * outline, shadow) put the date in the line under the title instead.
 */
export function EventTicket({ event, username, buttonStyle, onOpen }: Props) {
  const { day, month } = Format.dayMonth(event.startsAt);
  const stub = buttonStyle === "ticket";
  const where = event.venue || event.category;
  const meta =
    event.status === "live"
      ? "Happening now"
      : event.status === "past" && event.rating.count > 0
        ? `${Format.stars(event.rating.average)} ${event.rating.average} · ${event.rating.count} review${event.rating.count === 1 ? "" : "s"}`
        : stub
          ? where
          : [weekday(event.startsAt), where].filter(Boolean).join(" · ");

  return (
    <Link
      to={`/${username}/${event.slug}`}
      className={`ticket ticket--${buttonStyle}${event.status === "live" ? " is-live" : ""}`}
      onClick={() => onOpen?.(event)}
    >
      <span className="ticket-main">
        <span className="ticket-thumb" aria-hidden="true">
          {event.coverImage ? <img src={event.coverImage.url} alt="" loading="lazy" width={52} height={52} /> : event.emoji}
        </span>
        <span className="ticket-text">
          <span className="ticket-title">{event.title}</span>
          {meta && <span className="ticket-meta">{meta}</span>}
        </span>
        {/* Balances the thumbnail so the text sits in the true centre. */}
        {!stub && <span className="ticket-balance" aria-hidden="true" />}
      </span>
      {stub && (
        <span className="ticket-stub">
          <b aria-hidden="true">{day}</b>
          <span aria-hidden="true">{month}</span>
          <span className="sr-only">{new Date(event.startsAt).toDateString()}</span>
        </span>
      )}
    </Link>
  );
}
