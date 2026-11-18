import { PUBLIC_HOST } from "../../lib/config";
import { useShowcase } from "../../lib/useShowcase";
import { HostPage } from "../host/HostPage";
import { ThemeToggle } from "../ui";

/**
 * The right half of log-in and sign-up: a real example page, so people can
 * see what they're making while they fill in the form. Hidden on phones.
 */
export function AuthShowcase({ caption }: { caption: string }) {
  const { tree: sample, real } = useShowcase();
  return (
    <aside className="auth-side" aria-label={real ? `${sample.profile.displayName} on Event Tree` : "An example Event Tree page"}>
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
            {PUBLIC_HOST}/{sample.profile.username}
          </span>
        </div>
        <div className="auth-side-page">
          <HostPage tree={sample} preview />
        </div>
      </div>
      <p className="auth-side-caption">{caption}</p>
    </aside>
  );
}
