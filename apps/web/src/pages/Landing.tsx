import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ClaimForm } from "../components/brand/ClaimForm";
import { Logo } from "../components/brand/Logo";
import { SiteNav } from "../components/brand/SiteNav";
import { HostPage } from "../components/host/HostPage";
import { samplePage } from "../content/samplePage";
import { CoverArt, Icon, Stars } from "../components/ui";
import { PUBLIC_HOST } from "../lib/config";

/** Seeded local accounts (npm run seed). Production starts empty, so these only show in development. */
const DEMOS = !import.meta.env.DEV
  ? []
  : [
      { username: "buildersmeetup", name: "Builders Meetup", what: "Talks, hack weekends, career nights", category: "Tech" },
      { username: "nightandsong", name: "Night & Song", what: "Live music and late-night culture", category: "Music" },
      { username: "sunrisesports", name: "Sunrise Sports Club", what: "Fun runs and finals days", category: "Sports" },
    ];

/** Photo tiles for the "afterwards" stage: flat colour stand-ins for guest photos. */
const PHOTO_TONES = ["#5b3a8c", "#2f5d50", "#8c4a2f", "#2f4a8c"];

/** Views per event for the dashboard teaser. */
const STATS = [
  { title: "Rooftop Sessions", views: 1284, clicks: 412 },
  { title: "Open Mic Night", views: 836, clicks: 233 },
  { title: "Summer Block Party", views: 591, clicks: 120 },
];

/** The marketing home page: claim a name, see a real page, follow one event from announcement to reviews. */
export function Landing() {
  const { user } = useAuth();
  const [sample] = useState(samplePage);
  const maxViews = Math.max(...STATS.map((s) => s.views));

  return (
    <div className="landing lp">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteNav>
        <a href="#how">How it works</a>
        {DEMOS.length > 0 && <a href="#examples">Examples</a>}
      </SiteNav>

      <header className="lp-hero" id="main" tabIndex={-1}>
        <div className="lp-hero-copy">
          <h1>
            Every event
            <br />
            you host.
            <br />
            One link.
          </h1>
          <p className="lp-lede">
            Post what's coming up. When an event ends it files itself under Past, with the photos and reviews your guests leave.
          </p>
          <ClaimForm />
          <p className="lp-note">Free, and ready in about a minute.</p>
        </div>

        <figure className="lp-window" aria-label="An example Event Tree page">
          <div className="lp-window-bar" aria-hidden="true">
            <span className="lp-window-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="lp-window-url">
              {PUBLIC_HOST}/{sample.profile.username}
            </span>
          </div>
          <div className="lp-window-page">
            <HostPage tree={sample} preview />
          </div>
        </figure>
      </header>

      <section id="how" className="lp-section lp-life" aria-labelledby="life-title">
        <div className="lp-section-head">
          <h2 id="life-title">One event, start to finish</h2>
          <p>You add it once. The page keeps it current from the announcement to the last review.</p>
        </div>

        <ol className="lp-stages">
          <li className="lp-stage">
            <h3>
              <span className="lp-stage-n">1</span> You announce it
            </h3>
            <div className="lp-stage-card">
              <div className="lp-event">
                <CoverArt name="Rooftop Sessions" category="Music" size={56} />
                <div>
                  <b>Rooftop Sessions</b>
                  <span>The Terrace</span>
                </div>
              </div>
              <p className="lp-stage-status">Starts in 4 days</p>
              <div className="lp-fake-btns">
                <span className="lp-fake-btn is-primary">
                  <Icon name="ticket" size={16} /> Tickets
                </span>
                <span className="lp-fake-btn">
                  <Icon name="calendar" size={16} /> Add to calendar
                </span>
              </div>
            </div>
            <p>Title, date, a poster and the links people need: tickets, sign-up, slides, livestream.</p>
          </li>

          <li className="lp-stage">
            <h3>
              <span className="lp-stage-n">2</span> Doors open
            </h3>
            <div className="lp-stage-card is-live">
              <div className="lp-event">
                <CoverArt name="Rooftop Sessions" category="Music" size={56} />
                <div>
                  <b>Rooftop Sessions</b>
                  <span>The Terrace</span>
                </div>
              </div>
              <p className="lp-stage-status">
                <span className="live-pip" aria-hidden="true" />
                Happening now
              </p>
              <div className="lp-fake-btns">
                <span className="lp-fake-btn is-primary">
                  <Icon name="live" size={16} /> Watch live
                </span>
                <span className="lp-fake-btn">
                  <Icon name="star" size={16} /> Rate it
                </span>
              </div>
            </div>
            <p>The page marks it live on its own, and guests can start rating it.</p>
          </li>

          <li className="lp-stage">
            <h3>
              <span className="lp-stage-n">3</span> Afterwards
            </h3>
            <div className="lp-stage-card">
              <div className="lp-rating">
                <b>4.8</b>
                <div>
                  <Stars value={4.8} size={16} />
                  <span>37 reviews</span>
                </div>
              </div>
              <blockquote>Packed roof, brilliant set, best night of the summer.</blockquote>
              <div className="lp-photos" aria-hidden="true">
                {PHOTO_TONES.map((c, i) => (
                  <span key={c} style={{ background: c }}>
                    {i === PHOTO_TONES.length - 1 && "+24"}
                  </span>
                ))}
              </div>
            </div>
            <p>It moves to Past with every photo and review. You don't touch a thing.</p>
          </li>
        </ol>
      </section>

      <section className="lp-section lp-split" aria-labelledby="stats-title">
        <div className="lp-split-copy">
          <h2 id="stats-title">See what people open</h2>
          <p>
            Your dashboard counts page views and event clicks each day and ranks your events by interest. No cookies and no
            tracking pixels.
          </p>
          <Link className="btn btn-ghost" to={user ? "/admin/analytics" : "/signup"}>
            {user ? "Open analytics" : "Start your page"}
          </Link>
        </div>
        <div className="lp-stats" aria-hidden="true">
          <div className="lp-stats-head">
            <span>Event</span>
            <span>Views</span>
            <span>Clicks</span>
          </div>
          {STATS.map((s, i) => (
            <div key={s.title} className="lp-stats-row">
              <span className="lp-stats-rank">{i + 1}</span>
              <span className="lp-stats-title">
                {s.title}
                <i style={{ width: `${(s.views / maxViews) * 100}%` }} />
              </span>
              <b>{s.views.toLocaleString()}</b>
              <span>{s.clicks}</span>
            </div>
          ))}
        </div>
      </section>

      {DEMOS.length > 0 && (
        <section id="examples" className="lp-section" aria-labelledby="examples-title">
          <div className="lp-section-head">
            <h2 id="examples-title">Pages already running</h2>
          </div>
          <div className="lp-shelf">
            {DEMOS.map((d) => (
              <Link key={d.username} to={`/${d.username}`} className="lp-shelf-item">
                <CoverArt name={d.name} category={d.category} />
                <b>{d.name}</b>
                <span>{d.what}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="lp-final" aria-labelledby="final-title">
        <h2 id="final-title">Your next event needs a link.</h2>
        <ClaimForm size="small" />
      </section>

      <footer className="site-footer">
        <Logo inverted />
        <p>Event Tree is a link-in-bio page for people who host events.</p>
      </footer>
    </div>
  );
}
