import { Link } from "react-router-dom";

/** Event Tree's own mark: a ticket stub with a notch, plus the wordmark. */
export function Logo({ to = "/", inverted = false }: { to?: string; inverted?: boolean }) {
  return (
    <Link to={to} className={inverted ? "logo inverted" : "logo"} aria-label="Event Tree home">
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
        <path
          d="M4 7a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v5a4 4 0 0 0 0 8v5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-5a4 4 0 0 0 0-8z"
          fill="currentColor"
        />
        <path d="M20 8v3M20 14.5v3M20 21v3" stroke="var(--logo-cut, #fffaf2)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>Event Tree</span>
    </Link>
  );
}
