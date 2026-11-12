import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Format, type EventDTO } from "@event-tree/api-client";
import { ImageGallery } from "../../components/event/ImageGallery";
import { RatingBars } from "../../components/event/reviews/RatingBars";
import { ReviewForm } from "../../components/event/reviews/ReviewForm";
import { ReviewList } from "../../components/event/reviews/ReviewList";
import { api } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { appearanceStyle } from "../../theme/appearance";
import { NotFoundPage } from "../NotFoundPage";

const STATUS_LABEL: Record<EventDTO["status"], string> = {
  upcoming: "Upcoming",
  live: "Happening now",
  past: "Past event",
};

/** One event at /:username/:slug, styled with its host's appearance. */
export function PublicEventPage() {
  const { username = "", slug = "" } = useParams();
  const page = useResource(() => api.getPage(username), [username]);
  const event = useResource(() => api.getPageEvent(username, slug), [username, slug]);
  const reviews = useResource(() => (event.data ? api.listReviews(event.data.id) : Promise.resolve([])), [event.data?.id]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (event.data && page.data) document.title = `${event.data.title} | ${page.data.profile.displayName}`;
  }, [event.data, page.data]);

  if (event.error?.isNotFound || page.error?.isNotFound) return <NotFoundPage message="That event isn't on this page." />;
  if (!event.data || !page.data) return <p className="loading-note">{event.error?.message ?? page.error?.message ?? "Loading…"}</p>;

  const e = event.data;
  const links = [...e.links].sort((a, b) => Number(b.primary) - Number(a.primary));

  async function share() {
    const url = window.location.href;
    if (navigator.share) return void navigator.share({ title: e.title, url }).catch(() => undefined);
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`tree tree--${page.data.profile.appearance.buttonStyle}`} style={appearanceStyle(page.data.profile.appearance)}>
      <Link className="corner left" to={`/${username}`} aria-label={`Back to ${page.data.profile.displayName}`}>
        ←
      </Link>
      <button type="button" className="corner right" onClick={share} aria-label="Share this event">
        {copied ? "✓" : "↗"}
      </button>

      <main className="tree-column">
        <article className="event-detail">
          <div className="cover">
            {e.coverImage ? <img src={e.coverImage.url} alt={e.coverImage.alt} /> : <span className="cover-emoji">{e.emoji}</span>}
          </div>
          <p className={`status-tag ${e.status}`}>{STATUS_LABEL[e.status]}</p>
          <h1>{e.title}</h1>
          <p className="when">{Format.dateRange(e.startsAt, e.endsAt)}</p>
          <p className="tree-muted">{[e.venue, e.organizer].filter(Boolean).join(", ")}</p>
          {e.status === "upcoming" && <p className="countdown big">{Format.countdown(e)}</p>}
          {e.description && <p className="description">{e.description}</p>}

          {links.length > 0 && (
            <div className="link-stack">
              {links.map((l) => (
                <a key={l.url + l.label} className={l.primary ? "link-btn primary" : "link-btn"} href={l.url} target="_blank" rel="noreferrer">
                  <span aria-hidden="true">{Format.linkIcon(l.kind)}</span> {l.label}
                </a>
              ))}
            </div>
          )}
        </article>

        <ImageGallery event={e} onUpdated={event.set} />

        <section>
          <h2 className="tree-head">Reviews</h2>
          {e.acceptsReviews ? (
            <>
              <RatingBars summary={e.rating} />
              <ReviewForm
                eventId={e.id}
                onAdded={(review) => {
                  reviews.set([review, ...(reviews.data ?? [])]);
                  event.reload();
                }}
              />
              {reviews.data && <ReviewList reviews={reviews.data} />}
            </>
          ) : (
            <p className="tree-empty">Reviews open once the event starts.</p>
          )}
        </section>
      </main>
    </div>
  );
}
