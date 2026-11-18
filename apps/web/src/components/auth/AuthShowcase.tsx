import { PUBLIC_HOST } from "../../lib/config";
import { useShowcase } from "../../lib/useShowcase";
import { EventFeed } from "../community/EventFeed";
import { ThemeToggle } from "../ui";

/**
 * The right half of log-in and sign-up: what's on across Event Tree, each
 * event with the page hosting it. Hidden on phones.
 */
export function AuthShowcase({ caption }: { caption: string }) {
  const { events, real } = useShowcase();
  return (
    <aside className="auth-side" aria-label={real ? "Events on Event Tree" : "Example events on Event Tree"}>
      <div className="auth-side-toggle">
        <ThemeToggle />
      </div>
      <div className="auth-side-frame">
        <div className="lp-window-bar" aria-hidden="true">
          <span className="lp-window-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="lp-window-url">
            {PUBLIC_HOST}/explore
          </span>
        </div>
        <div className="auth-side-page">
          <EventFeed events={events} max={4} />
        </div>
      </div>
      <p className="auth-side-caption">{caption}</p>
    </aside>
  );
}
