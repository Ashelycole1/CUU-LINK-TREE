import { useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { EventDTO, TreeDTO } from "@event-tree/api-client";
import { pageUrl } from "../../lib/api";
import { dayNumber, headerTint, monthShort, startsIn, whenLine } from "../../lib/dates";
import { FONT_STACKS } from "../../theme/appearance";
import { CircleAction, CoverArt, Icon, IconButton, Stars, ThemeToggle, useToast } from "../ui";
import { SocialIcon } from "../tree/SocialIcon";

interface Props {
  tree: TreeDTO;
  /** Visitor opened an event (click analytics). */
  onOpen?: (event: EventDTO) => void;
  /** A picture of a page (the landing hero): links do nothing and the page sits in a smaller frame. */
  preview?: boolean;
}

/**
 * A host's public page, laid out like an album page: a header washed in the
 * host's own colour, their artwork and name, one big "open next event" button,
 * then the events as a dated track list. Used by /:username and the landing hero.
 */
export function HostPage({ tree, onOpen, preview = false }: Props) {
  const { profile } = tree;
  const [tab, setTab] = useState<"upcoming" | "past">(tree.upcoming.length === 0 && tree.past.length > 0 ? "past" : "upcoming");
  const navigate = useNavigate();
  const toast = useToast();
  const list = tab === "upcoming" ? tree.upcoming : tree.past;
  const next = tree.upcoming[0];
  const colour = profile.appearance.colors.background;
  const url = pageUrl(profile.username);
  // The header image fills the header background; the art shows the profile picture.
  const cover = profile.heroImageUrl && profile.avatarUrl ? profile.heroImageUrl : "";
  const photo = profile.avatarUrl || profile.heroImageUrl;

  const open = (e: EventDTO) => {
    if (preview) return;
    onOpen?.(e);
    navigate(`/${profile.username}/${e.slug}`);
  };

  async function share() {
    if (preview) return;
    if (navigator.share) {
      await navigator.share({ title: profile.displayName, url: url.href }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url.href);
    toast("Link copied", { tone: "success" });
  }

  return (
    <div
      className={`host${preview ? " host--preview" : ""}`}
      style={{ "--host-tint": headerTint(colour), "--host-font": FONT_STACKS[profile.appearance.font], "--host-cover": cover ? `url(${JSON.stringify(cover)})` : undefined } as CSSProperties}
      inert={preview}
    >
      <header className={`host-head${cover ? " has-cover" : ""}`}>
        <CoverArt src={photo} name={profile.displayName} icon="users" className="host-art" radius="var(--radius-sm)" />
        <div className="host-id">
          <p className="host-kind">Event page</p>
          <h1 className="host-name">{profile.displayName}</h1>
          {profile.bio && <p className="host-bio">{profile.bio}</p>}
          <p className="host-meta">
            <b>@{profile.username}</b>
            <span>
              {tree.upcoming.length} upcoming, {tree.past.length} past
            </span>
          </p>
        </div>
      </header>

      <div className="host-body">
        <div className="host-actions">
          {next ? (
            <CircleAction label={`Open ${next.title}`} size={56} onClick={() => open(next)} />
          ) : (
            <span className="host-actions-spacer" />
          )}
          {next && (
            <div className="host-next">
              <span>Next up</span>
              <b>{next.title}</b>
              <span>{startsIn(next.startsAt, next.endsAt)}</span>
            </div>
          )}
          <div className="host-actions-icons">
            {profile.socials.map((s) => (
              <a key={s.platform} className="icon-btn" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.platform}>
                <SocialIcon platform={s.platform} />
              </a>
            ))}
            {!preview && (
              <Link className="icon-btn" to="/explore" aria-label="More events in Community" title="More events in Community">
                <Icon name="search" size={20} />
              </Link>
            )}
            <IconButton icon="share" label="Share this page" onClick={share} />
            {!preview && <ThemeToggle />}
          </div>
        </div>

        <div className="host-tabs" role="tablist" aria-label="Events">
          <button type="button" role="tab" aria-selected={tab === "upcoming"} className={tab === "upcoming" ? "is-on" : ""} onClick={() => setTab("upcoming")}>
            Upcoming <span>{tree.upcoming.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === "past"} className={tab === "past" ? "is-on" : ""} onClick={() => setTab("past")}>
            Past <span>{tree.past.length}</span>
          </button>
        </div>

        {list.length === 0 ? (
          <p className="host-empty">{tab === "upcoming" ? "Nothing announced yet. Check back soon." : "No past events yet."}</p>
        ) : (
          <ol className="host-list" role="list">
            {list.map((e) => (
              <li key={e.id}>
                <Link
                  to={`/${profile.username}/${e.slug}`}
                  className={`host-row${e.status === "past" ? " is-past" : ""}${e.status === "live" ? " is-live" : ""}`}
                  onClick={(ev) => {
                    if (preview) ev.preventDefault();
                    else onOpen?.(e);
                  }}
                  tabIndex={preview ? -1 : undefined}
                >
                  <span className="host-date" aria-hidden="true">
                    <b>{dayNumber(e.startsAt)}</b>
                    <span>{monthShort(e.startsAt)}</span>
                  </span>
                  <CoverArt src={e.coverImage?.url} name={e.title} category={e.category} size={48} className="host-row-art" />
                  <span className="host-row-main">
                    <span className="host-row-title">
                      {e.status === "live" && <span className="live-pip" aria-label="Happening now" />}
                      {e.title}
                    </span>
                    <span className="host-row-sub">
                      {e.status === "past" && e.rating.count > 0 ? (
                        <>
                          <Stars value={e.rating.average} size={12} /> {e.rating.average.toFixed(1)}, {e.rating.count} review{e.rating.count === 1 ? "" : "s"}
                        </>
                      ) : (
                        e.venue || e.category
                      )}
                    </span>
                  </span>
                  <span className="host-row-when">{whenLine(e.startsAt)}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}

        {!preview && (
          <footer className="host-foot">
            <Link to="/explore" className="host-more">
              <span className="host-more-icon" aria-hidden="true">
                <Icon name="search" size={20} />
              </span>
              <span className="host-more-text">
                <b>Find more events</b>
                <span>See what's on across Event Tree in Community</span>
              </span>
              <Icon name="right" size={18} />
            </Link>
            <Link to="/" className="host-made">Make a page like this on Event Tree</Link>
          </footer>
        )}
      </div>
    </div>
  );
}
