import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { ThemeToggle } from "../ui";
import { Logo } from "./Logo";

/** The top bar on Event Tree's own public pages (landing, Community): logo, links, theme, account. */
export function SiteNav({ children }: { children?: ReactNode }) {
  const { user } = useAuth();
  return (
    <nav className="site-nav" aria-label="Main">
      <Logo />
      <div className="site-nav-links">
        <NavLink to="/explore">Community</NavLink>
        {children}
      </div>
      <div className="site-nav-actions">
        <ThemeToggle />
        {user ? (
          <Link className="btn btn-primary" to="/admin">
            Open dashboard
          </Link>
        ) : (
          <>
            <Link className="btn btn-ghost" to="/login">
              Log in
            </Link>
            <Link className="btn btn-primary" to="/signup">
              Sign up free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
