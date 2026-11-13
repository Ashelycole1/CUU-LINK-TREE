import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ClaimForm } from "../components/brand/ClaimForm";
import { Logo } from "../components/brand/Logo";
import { PhoneFrame } from "../components/brand/PhoneFrame";
import { EventTicket } from "../components/tree/EventTicket";
import { TreeView } from "../components/tree/TreeView";
import { samplePage } from "../content/samplePage";

/** Seeded local accounts (npm run seed). Production starts empty, so these only show in development. */
const DEMOS = !import.meta.env.DEV ? [] : [
  { username: "buildersmeetup", name: "Builders Meetup", what: "Talks, hack weekends, career nights", tone: "blue" },
  { username: "nightandsong", name: "Night & Song", what: "Live music and late-night culture", tone: "plum" },
  { username: "sunrisesports", name: "Sunrise Sports Club", what: "Fun runs and finals days", tone: "pink" },
];

/** The marketing home page: claim a name, see a live page, learn what a host gets. */
export function Landing() {
  const { user } = useAuth();
  const [sample] = useState(samplePage);
  const sampleTickets = [...sample.upcoming.slice(0, 2), ...sample.past.slice(0, 1)];

  return (
    <div className="landing">
      <nav className="site-nav" aria-label="Main">
        <Logo />
        <div className="site-nav-links">
          <a href="#how">How it works</a>
          {DEMOS.length > 0 && <a href="#examples">Examples</a>}
        </div>
        <div className="site-nav-actions">
          {user ? (
            <Link className="btn btn-dark" to="/admin">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">
                Log in
              </Link>
              <Link className="btn btn-dark" to="/signup">
                Sign up free
              </Link>
            </>
          )}
        </div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <h1>One link for every event you host.</h1>
          <p>
            Post what's coming up. Past events move to the archive on their own, with the photos and reviews people leave
            afterwards. Put one link in your bio and you're done.
          </p>
          <ClaimForm />
          <p className="hero-note">Free. Takes a minute. No app to install.</p>
        </div>
        <div className="hero-phone">
          <PhoneFrame title="An example Event Tree page: a host's name, bio and social links, then one button per event">
            <TreeView tree={sample} preview />
          </PhoneFrame>
        </div>
      </header>

      <section id="how" className="band band-yellow">
        <div className="band-copy">
          <h2>Every event is a ticket.</h2>
          <p>
            Add a title, a date and a poster link, and it appears on your page as a ticket people can tap. Add buttons for
            tickets, sign-ups, slides or a livestream. Hide an event with one switch while you finish it.
          </p>
        </div>
        <div className="band-visual ticket-stack" inert style={{ "--t-card": "#fffaf2", "--t-card-text": "#2a0f3d", "--t-accent": "#ff3d7f" } as React.CSSProperties}>
          {sampleTickets.map((e) => (
            <EventTicket key={e.id} event={e} username={sample.profile.username} buttonStyle="ticket" />
          ))}
        </div>
      </section>

      <section className="band band-plum">
        <div className="band-copy">
          <h2>Upcoming and past sort themselves.</h2>
          <p>
            The moment an event ends it moves to Past events at the foot of your page, with its photos and reviews. Each
            event page counts down to the start. You never edit a thing.
          </p>
        </div>
        <div className="band-visual switch-demo" aria-hidden="true">
          <span className="switch-demo-pill on">Upcoming 3</span>
          <span className="switch-demo-pill">Past 12</span>
          <span className="switch-demo-count">in 8d 4h</span>
        </div>
      </section>

      <section className="band band-pink">
        <div className="band-copy">
          <h2>Photos and reviews after the doors close.</h2>
          <p>
            Once an event starts, people can leave a star rating and a few words, and add photos by link. Your page shows
            the average and every review.
          </p>
        </div>
        <div className="band-visual review-demo" aria-hidden="true">
          <b>4.5</b>
          <span className="review-demo-stars">★★★★★</span>
          <p>“Packed room and brilliant speakers.”</p>
        </div>
      </section>

      <section className="band band-paper">
        <div className="band-copy">
          <h2>See which events people open.</h2>
          <p>Your dashboard counts page views and event clicks per day, and ranks your events by interest. No cookies, no tracking pixels.</p>
        </div>
        <div className="band-visual bars-demo" aria-hidden="true">
          {[30, 52, 41, 68, 59, 84, 72].map((h, i) => (
            <span key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
      </section>

      {DEMOS.length > 0 && (
      <section id="examples" className="examples">
        <h2>See it in use</h2>
        <div className="example-grid">
          {DEMOS.map((d) => (
            <Link key={d.username} to={`/${d.username}`} className={`example example--${d.tone}`}>
              <b>{d.name}</b>
              <span>{d.what}</span>
              <span className="example-url">/{d.username}</span>
            </Link>
          ))}
        </div>
      </section>
      )}

      <section className="final-cta">
        <h2>Your next event needs a link.</h2>
        <ClaimForm size="small" />
      </section>

      <footer className="site-footer">
        <Logo inverted />
        <p>Event Tree: a link-in-bio page for people who host events.</p>
      </footer>
    </div>
  );
}
