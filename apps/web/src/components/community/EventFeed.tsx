import { Link } from "react-router-dom";
import type { CommunityEventDTO } from "@event-tree/api-client";
import { dayNumber, monthShort, startsIn, weekdayShort } from "../../lib/dates";
import { CoverArt } from "../ui";

const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/**
 * A compact "What's on" feed: events first, each with the page that hosts it
 * underneath. The first event is shown large. Used in the landing hero and
 * beside the log-in and sign-up forms.
 */
export function EventFeed({ events, max = 5 }: { events: CommunityEventDTO[]; max?: number }) {
  const live = events.filter((x) => x.event.status === "live").length;
  const [first, ...rest] = events.slice(0, max);

  return (
    <div className="feed">
      <div className="feed-head">
        <div>
          <p className="feed-kicker">Community</p>
          <p className="feed-title">What's on</p>
        </div>
        <span className={`feed-count${live ? " is-live" : ""}`}>{live ? `${live} live now` : `${events.length} coming up`}</span>
      </div>

      {first && (
        <Link className="feed-hero" to={`/${first.host.username}/${first.event.slug}`}>
          <span className="feed-hero-art">
            <CoverArt src={first.event.coverImage?.url} name={first.event.title} category={first.event.category} radius="inherit" />
            {first.event.status === "live" && <span className="cm-live">Live</span>}
          </span>
          <span className="feed-hero-text">
            <span className="feed-when">
              {first.event.status === "live"
                ? "Happening now"
                : `${weekdayShort(first.event.startsAt)} ${dayNumber(first.event.startsAt)} ${monthShort(first.event.startsAt)} · ${time(first.event.startsAt)}`}
            </span>
            <b className="feed-hero-title">{first.event.title}</b>
            {first.event.venue && <span className="feed-venue">{first.event.venue}</span>}
            <span className="feed-host">
              <CoverArt src={first.host.avatarUrl || null} name={first.host.displayName} icon="users" size={22} round />
              <span>
                <span className="feed-by">by</span> {first.host.displayName}
              </span>
            </span>
          </span>
        </Link>
      )}

      {rest.length > 0 && (
        <ul className="feed-list" role="list">
          {rest.map(({ event: e, host }) => (
            <li key={e.id}>
              <Link className="feed-row" to={`/${host.username}/${e.slug}`}>
                <span className="feed-date" aria-hidden="true">
                  <span>{monthShort(e.startsAt)}</span>
                  <b>{dayNumber(e.startsAt)}</b>
                </span>
                <CoverArt src={e.coverImage?.url} name={e.title} category={e.category} size={48} />
                <span className="feed-row-text">
                  <b>{e.title}</b>
                  <span className={e.status === "live" ? "is-live" : undefined}>
                    {e.status === "live" ? "Happening now" : `${time(e.startsAt)} · ${startsIn(e.startsAt, e.endsAt).replace("Starts ", "")}`}
                  </span>
                  <span className="feed-row-host">{host.displayName}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link className="feed-all" to="/explore">
        See all events
      </Link>
    </div>
  );
}
