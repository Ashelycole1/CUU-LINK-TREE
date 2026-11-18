import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { CommunityEventDTO } from "@event-tree/api-client";
import { dayNumber, headerTint, monthShort, startsIn, weekdayShort } from "../../lib/dates";
import { CoverArt } from "../ui";

/** One event from any host, album style: art with a date leaf, then title, time, place and host. */
export function CommunityCard({ item: { event: e, host } }: { item: CommunityEventDTO }) {
  const time = new Date(e.startsAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <Link className="cm-card" to={`/${host.username}/${e.slug}`} style={{ "--host-tint": headerTint(host.color) } as CSSProperties}>
      <div className="cm-art">
        <CoverArt src={e.coverImage?.url} name={e.title} category={e.category} radius="inherit" />
        <span className="cm-date" aria-hidden="true">
          <span>{monthShort(e.startsAt)}</span>
          <b>{dayNumber(e.startsAt)}</b>
        </span>
        {e.status === "live" ? <span className="cm-live">Live</span> : <span className="cm-cat">{e.category}</span>}
      </div>
      <div className="cm-text">
        <b className="cm-title">{e.title}</b>
        <span className={`cm-when${e.status === "live" ? " is-live" : ""}`}>
          {e.status === "live" ? "Happening now" : `${weekdayShort(e.startsAt)} ${time} · ${startsIn(e.startsAt, e.endsAt).replace("Starts ", "")}`}
        </span>
        {e.venue && <span className="cm-venue">{e.venue}</span>}
        <span className="cm-host">
          <CoverArt src={host.avatarUrl || null} name={host.displayName} icon="users" size={20} round />
          {host.displayName}
        </span>
      </div>
    </Link>
  );
}
