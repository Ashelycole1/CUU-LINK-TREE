import { createContext, useCallback, useContext, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { ProfileDTO } from "@event-tree/api-client";
import { useAuth } from "../../auth/AuthContext";
import { Logo } from "../../components/brand/Logo";
import { PhoneFrame } from "../../components/brand/PhoneFrame";
import { api, pageUrl } from "../../lib/api";
import { useResource, type Resource } from "../../lib/useResource";

interface AdminContextValue {
  profile: Resource<ProfileDTO>;
  /** Call after any save so the phone preview reloads. */
  refreshPreview: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const value = useContext(AdminContext);
  if (!value) throw new Error("useAdmin must be used inside <AdminLayout>.");
  return value;
}

const NAV = [
  { to: "/admin", label: "Events", icon: "🎟️", end: true },
  { to: "/admin/appearance", label: "Appearance", icon: "🎨", end: false },
  { to: "/admin/analytics", label: "Analytics", icon: "📈", end: false },
];

/**
 * The host dashboard frame: sidebar, a bar with the live link, the editor
 * in the middle and a phone preview of the real page on the right.
 */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const profile = useResource(() => api.getMyProfile(), []);
  const [version, setVersion] = useState(0);
  const [copied, setCopied] = useState(false);
  const refreshPreview = useCallback(() => setVersion((v) => v + 1), []);

  const username = user!.username;
  const url = pageUrl(username);

  async function copy() {
    await navigator.clipboard?.writeText(url.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <AdminContext.Provider value={{ profile, refreshPreview }}>
      <div className="admin">
        <aside className="admin-side">
          <Logo to="/admin" />
          <nav aria-label="Dashboard">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className="side-link">
                <span aria-hidden="true">{n.icon}</span> {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="side-account">
            <span className="side-avatar" aria-hidden="true">
              {(profile.data?.displayName ?? username).slice(0, 1).toUpperCase()}
            </span>
            <span className="side-who">
              <b>{profile.data?.displayName ?? username}</b>
              <small>@{username}</small>
            </span>
            <button type="button" className="text-btn" onClick={logout}>
              Log out
            </button>
          </div>
        </aside>

        <div className="admin-main">
          <div className="live-bar">
            <span className="live-dot" aria-hidden="true" />
            <span className="live-text">
              <span className="live-label">Your page is live: </span>
              <a href={url.href} target="_blank" rel="noreferrer">{url.label}</a>
            </span>
            <button type="button" className="btn btn-small btn-light" onClick={copy}>
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <div className="admin-content">
            <Outlet />
          </div>
        </div>

        <aside className="admin-preview" aria-label="Live preview">
          <PhoneFrame username={username} version={version} />
          <a className="preview-open" href={url.href} target="_blank" rel="noreferrer">
            Open your page
          </a>
        </aside>
      </div>
    </AdminContext.Provider>
  );
}
