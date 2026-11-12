import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Format, type EventDTO } from "@event-tree/api-client";

/** A card in the swipeable "Next up" row, with a countdown that ticks every 30 seconds. */
export function NextUpCard({ event, username, onOpen }: { event: EventDTO; username: string; onOpen?: (e: EventDTO) => void }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const countdown = Format.countdown(event, now);
  return (
    <Link className="next-card" to={`/${username}/${event.slug}`} onClick={() => onOpen?.(event)}>
      <span className="next-image">
        {event.coverImage ? <img src={event.coverImage.url} alt={event.coverImage.alt} /> : <span>{event.emoji}</span>}
      </span>
      <span className="next-title">{event.title}</span>
      <span className={countdown === "Happening now" ? "countdown live" : "countdown"}>{countdown}</span>
    </Link>
  );
}
