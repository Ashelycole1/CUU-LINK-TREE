import { Link } from "react-router-dom";
import { Format, type ButtonStyle, type EventDTO } from "@event-tree/api-client";

interface Props {
  event: EventDTO;
  username: string;
  buttonStyle: ButtonStyle;
  onOpen?: (event: EventDTO) => void;
}

/**
 * One event on a public page. In the default "ticket" style it is a paper
 * ticket: details on the left, a perforated stub with the date on the
 * right. The other styles (pill, outline, shadow) reuse the same markup.
 */
export function EventTicket({ event, username, buttonStyle, onOpen }: Props) {
  const { day, month } = Format.dayMonth(event.startsAt);
  const meta =
    event.status === "live"
      ? "Happening now"
      : event.status === "past" && event.rating.count > 0
        ? `${Format.stars(event.rating.average)} ${event.rating.average} · ${event.rating.count} review${event.rating.count === 1 ? "" : "s"}`
        : event.venue || event.category;

  return (
    <Link
      to={`/${username}/${event.slug}`}
      className={`ticket ticket--${buttonStyle}${event.status === "live" ? " is-live" : ""}`}
      onClick={() => onOpen?.(event)}
    >
      <span className="ticket-main">
        <span className="ticket-thumb" aria-hidden="true">
          {event.coverImage ? <img src={event.coverImage.url} alt="" loading="lazy" /> : event.emoji}
        </span>
        <span className="ticket-text">
          <span className="ticket-title">{event.title}</span>
          <span className="ticket-meta">{meta}</span>
        </span>
      </span>
      <span className="ticket-stub" aria-label={new Date(event.startsAt).toDateString()}>
        <b>{day}</b>
        <span>{month}</span>
      </span>
    </Link>
  );
}
