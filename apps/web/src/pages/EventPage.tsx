import { useState } from "react";
import { useParams } from "react-router-dom";
import { Format, type EventDTO } from "@event-tree/api-client";
import { ImageGallery } from "../components/ImageGallery";
import { Page, StatusNote } from "../components/Page";
import { RatingBars } from "../components/reviews/RatingBars";
import { ReviewForm } from "../components/reviews/ReviewForm";
import { ReviewList } from "../components/reviews/ReviewList";
import { api } from "../lib/api";
import { useResource } from "../lib/useResource";

const STATUS_LABEL: Record<EventDTO["status"], string> = {
  upcoming: "Upcoming",
  live: "Happening now",
  past: "Past event",
};

/** One event: cover, details, links, photo gallery and reviews. */
export function EventPage() {
  const { slug = "" } = useParams();
  const event = useResource(() => api().getEvent(slug), [slug]);
  const reviews = useResource(() => api().listReviews(slug), [slug]);
  const [copied, setCopied] = useState(false);

  async function share(e: EventDTO) {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: e.title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  if (!event.data) {
    return (
      <Page back>
        <StatusNote loading={event.loading} error={event.error} onRetry={event.reload} />
      </Page>
    );
  }

  const e = event.data;
  const links = [...e.links].sort((a, b) => Number(b.primary) - Number(a.primary));

  return (
    <Page
      back
      action={
        <button type="button" className="corner right" onClick={() => share(e)} aria-label="Share this event">
          {copied ? "✓" : "↗"}
        </button>
      }
    >
      <article className="event-detail">
        <div className="cover">
          {e.coverImage ? <img src={e.coverImage.url} alt={e.coverImage.alt} /> : <span className="cover-emoji">{e.emoji}</span>}
        </div>

        <p className={`status-tag ${e.status}`}>{STATUS_LABEL[e.status]}</p>
        <h1>{e.title}</h1>
        <p className="when">{Format.dateRange(e.startsAt, e.endsAt)}</p>
        <p className="muted">{[e.venue, e.organizer, e.category].filter(Boolean).join(" · ")}</p>
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
        <h2 className="head">Reviews</h2>
        {e.acceptsReviews ? (
          <>
            <RatingBars summary={e.rating} />
            <ReviewForm
              eventSlug={e.slug}
              onAdded={(review) => {
                reviews.set([review, ...(reviews.data ?? [])]);
                event.reload();
              }}
            />
            <StatusNote loading={reviews.loading && !reviews.data} error={reviews.error} />
            {reviews.data && <ReviewList reviews={reviews.data} />}
          </>
        ) : (
          <p className="muted center">Reviews open once the event starts.</p>
        )}
      </section>
    </Page>
  );
}
