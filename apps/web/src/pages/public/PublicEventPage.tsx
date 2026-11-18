import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import type { EventDTO } from "@event-tree/api-client";
import { ImageGallery } from "../../components/event/ImageGallery";
import { Countdown, PhaseRail, calendarFile, googleCalendarUrl, outlookCalendarUrl } from "../../components/event/EventFlow";
import { RatingBars } from "../../components/event/reviews/RatingBars";
import { ReviewForm } from "../../components/event/reviews/ReviewForm";
import { ReviewList } from "../../components/event/reviews/ReviewList";
import { api } from "../../lib/api";
import { dayNumber, headerTint, monthShort, startsIn, weekdayShort } from "../../lib/dates";
import { useResource } from "../../lib/useResource";
import { FONT_STACKS } from "../../theme/appearance";
import { CoverArt, IconButton, Stars, ThemeToggle, useToast } from "../../components/ui";
import { Icon, LINK_ICONS } from "../../components/ui/Icon";
import { PageSkeleton } from "../../components/ui/PageSkeleton";
import { NotFoundPage } from "../NotFoundPage";

const KIND: Record<EventDTO["status"], string> = { upcoming: "Upcoming event", live: "Happening now", past: "Past event" };

function timeRange(e: EventDTO): string {
  const t = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${t(e.startsAt)} to ${t(e.endsAt)}`;
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/**
 * One event at /:username/:slug. The page follows the event's life: before
 * it starts the countdown and tickets lead; while it's on, the live links
 * and rating; afterwards, the photos and reviews.
 */
export function PublicEventPage() {
  const { username = "", slug = "" } = useParams();
  const page = useResource(() => api.getPage(username), [username]);
  const event = useResource(() => api.getPageEvent(username, slug), [username, slug]);
  const reviews = useResource(() => (event.data ? api.listReviews(event.data.id) : Promise.resolve([])), [event.data?.id]);
  const [calOpen, setCalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (event.data && page.data) document.title = `${event.data.title} | ${page.data.profile.displayName}`;
  }, [event.data, page.data]);

  if (event.error?.isNotFound || page.error?.isNotFound) return <NotFoundPage message="That event isn't on this page." />;
  if (!event.data || !page.data) {
    const failed = event.error ?? page.error;
    return failed ? <p className="loading-note" role="alert">{failed.message}</p> : <PageSkeleton variant="event" />;
  }

  const e = event.data;
  const { profile } = page.data;
  const links = [...e.links].sort((a, b) => Number(b.primary) - Number(a.primary));
  const more = [...page.data.upcoming, ...page.data.past].filter((x) => x.id !== e.id).slice(0, 4);
  const url = window.location.href;

  async function share() {
    if (navigator.share) return void navigator.share({ title: e.title, url }).catch(() => undefined);
    await navigator.clipboard?.writeText(url);
    toast("Link copied", { tone: "success" });
  }

  function saveToCalendar() {
    const href = calendarFile(e, url);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${e.slug}.ics`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  /* ---- the sections, ordered by where the event is in its life ---- */
  const actions = (
    <section className="ep-card" aria-labelledby="ep-go">
      <h2 id="ep-go" className="sr-only">
        {e.status === "past" ? "Links" : "Get there"}
      </h2>
      {e.status !== "past" ? (
        <Countdown event={e} />
      ) : (
        <div className="ep-card-score">
          {e.rating.count > 0 ? (
            <>
              <b>{e.rating.average.toFixed(1)}</b>
              <span>
                <Stars value={e.rating.average} size={16} />
                {e.rating.count} review{e.rating.count === 1 ? "" : "s"}, {e.gallery.length} photo{e.gallery.length === 1 ? "" : "s"}
              </span>
            </>
          ) : (
            <span className="ep-card-note">This event has ended. Were you there? Leave the first review.</span>
          )}
          <a className="ep-link is-primary" href="#ep-reviews">
            <Icon name="star" size={20} />
            <span>Rate this event</span>
            <Icon name="down" size={16} />
          </a>
        </div>
      )}
      <div className="ep-links">
        {links.map((l) => (
          <a key={l.url + l.label} className={`ep-link${l.primary && e.status !== "past" ? " is-primary" : ""}`} href={l.url} target="_blank" rel="noreferrer">
            <Icon name={LINK_ICONS[l.kind]} size={20} />
            <span>{l.label}</span>
            <Icon name="external" size={16} />
          </a>
        ))}
        {e.status === "upcoming" && (
          <button type="button" className="ep-link" aria-expanded={calOpen} aria-controls="ep-calendars" onClick={() => setCalOpen((v) => !v)}>
            <Icon name="calendar" size={20} />
            <span>Add to calendar</span>
            <Icon name={calOpen ? "up" : "down"} size={16} />
          </button>
        )}
        {e.status === "upcoming" && calOpen && (
          <ul className="ep-calendars" id="ep-calendars" role="list">
            <li>
              <a href={googleCalendarUrl(e, url)} target="_blank" rel="noreferrer">
                <b>Google Calendar</b>
                <span>Opens it</span>
                <Icon name="external" size={16} />
              </a>
            </li>
            <li>
              <a href={outlookCalendarUrl(e, url)} target="_blank" rel="noreferrer">
                <b>Outlook</b>
                <span>Opens it</span>
                <Icon name="external" size={16} />
              </a>
            </li>
            <li>
              <button type="button" onClick={saveToCalendar}>
                <b>Apple Calendar</b>
                <span>.ics file</span>
                <Icon name="down" size={16} />
              </button>
            </li>
          </ul>
        )}
      </div>
    </section>
  );

  const details = (
    <section className="ep-block" aria-labelledby="ep-details" key="details">
      <h2 id="ep-details" className="ep-h2">
        Details
      </h2>
      <dl className="ep-facts">
        <div>
          <dt>
            <Icon name="calendar" size={18} />
            Date
          </dt>
          <dd>{longDate(e.startsAt)}</dd>
        </div>
        <div>
          <dt>
            <Icon name="clock" size={18} />
            Time
          </dt>
          <dd>{timeRange(e)}</dd>
        </div>
        {e.venue && (
          <div>
            <dt>
              <Icon name="mapPin" size={18} />
              Where
            </dt>
            <dd>{e.venue}</dd>
          </div>
        )}
        {e.organizer && (
          <div>
            <dt>
              <Icon name="users" size={18} />
              Host
            </dt>
            <dd>{e.organizer}</dd>
          </div>
        )}
      </dl>
      {e.description && <p className="ep-about">{e.description}</p>}
    </section>
  );

  const photos = (
    <section className="ep-block ep-photos" key="photos">
      <ImageGallery event={e} onUpdated={event.set} />
    </section>
  );

  const reviewBlock = (
    <section className="ep-block ep-reviews" aria-labelledby="ep-reviews" key="reviews">
      <h2 id="ep-reviews" className="ep-h2">
        Reviews
      </h2>
      {e.acceptsReviews ? (
        <>
          <RatingBars summary={e.rating} />
          <ReviewForm
            eventId={e.id}
            onAdded={(review) => {
              reviews.set([review, ...(reviews.data ?? [])]);
              event.reload();
              toast("Review posted", { tone: "success" });
            }}
          />
          {reviews.data && <ReviewList reviews={reviews.data} />}
        </>
      ) : (
        <p className="ep-locked">
          <Icon name="clock" size={18} />
          Reviews open when the doors do, {startsIn(e.startsAt, e.endsAt).replace(/^Starts /, "")}.
        </p>
      )}
    </section>
  );

  const order: ReactNode[] =
    e.status === "upcoming" ? [details, photos, reviewBlock] : e.status === "live" ? [reviewBlock, photos, details] : [reviewBlock, photos, details];

  return (
    <div
      className={`ep is-${e.status}`}
      style={{ "--host-tint": headerTint(profile.appearance.colors.background), "--host-font": FONT_STACKS[profile.appearance.font] } as CSSProperties}
    >
      <nav className="ep-nav" aria-label="Event">
        <Link to={`/${username}`} className="ep-back">
          <Icon name="back" size={20} />
          <CoverArt src={profile.avatarUrl || profile.heroImageUrl} name={profile.displayName} icon="users" size={28} round />
          <span>{profile.displayName}</span>
        </Link>
        <div className="ep-nav-actions">
          <ThemeToggle />
          <IconButton icon="share" label="Share this event" onClick={share} />
        </div>
      </nav>

      <header
        className={`ep-hero${e.coverImage ? " has-cover" : ""}`}
        style={e.coverImage ? ({ "--ep-cover": `url(${JSON.stringify(e.coverImage.url)})` } as CSSProperties) : undefined}
      >
        <div className="ep-poster">
          {e.coverImage ? (
            <img src={e.coverImage.url} alt={e.coverImage.alt} />
          ) : (
            <CoverArt name={e.title} category={e.category} radius="inherit" className="ep-poster-fallback" />
          )}
        </div>
        <div className="ep-title">
          <p className={`ep-kind is-${e.status}`}>
            {e.status === "live" && <span className="live-pip" aria-hidden="true" />}
            {KIND[e.status]}
          </p>
          <h1>{e.title}</h1>
          <div className="ep-when">
            <span className="ep-cal" aria-hidden="true">
              <span>{monthShort(e.startsAt)}</span>
              <b>{dayNumber(e.startsAt)}</b>
            </span>
            <span className="ep-when-text">
              <b>
                {weekdayShort(e.startsAt)}, {timeRange(e)}
              </b>
              <span>{[e.venue, e.category].filter(Boolean).join(", ")}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="ep-body">
        <div className="ep-grid">
          <div className="ep-main">
            <PhaseRail event={e} />
            <div className="ep-flow">{order}</div>
          </div>
          <aside className="ep-aside">{actions}</aside>
        </div>

        {more.length > 0 && (
          <section className="ep-more" aria-labelledby="ep-more">
            <h2 id="ep-more" className="ep-h2">
              More from {profile.displayName}
            </h2>
            <ul className="ep-more-list">
              {more.map((x) => (
                <li key={x.id}>
                  <Link to={`/${username}/${x.slug}`} className={`ep-more-item is-${x.status}`}>
                    <CoverArt src={x.coverImage?.url} name={x.title} category={x.category} />
                    <b>{x.title}</b>
                    <span>
                      {dayNumber(x.startsAt)} {monthShort(x.startsAt)}
                      {x.status === "past" ? ", past" : x.status === "live" ? ", live now" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="host-foot">
          <Link to="/">Make a page like this on Event Tree</Link>
        </footer>
      </div>
    </div>
  );
}
