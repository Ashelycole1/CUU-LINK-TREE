import { createContext, useCallback, useContext, useState, type CSSProperties } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { ProfileDTO } from "@event-tree/api-client";
import { useAuth } from "../../auth/AuthContext";
import { Logo } from "../../components/brand/Logo";
import { PhoneFrame } from "../../components/brand/PhoneFrame";
import { CoverArt, Menu, ThemeToggle, useToast } from "../../components/ui";
import { Icon, type IconName } from "../../components/ui/Icon";
import { api, pageUrl } from "../../lib/api";
import { headerTint } from "../../lib/dates";
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

const NAV: { to: string; label: string; icon: IconName; end: boolean }[] = [
  { to: "/admin", label: "Events", icon: "ticket", end: true },
  { to: "/admin/appearance", label: "Appearance", icon: "palette", end: false },
  { to: "/admin/analytics", label: "Analytics", icon: "chart", end: false },
];

/**
 * The host dashboard: three rounded panels on a black canvas. Navigation and
 * the host's page on the left, the editor in the middle (washed in the host's
 * own page colour), and a live phone preview on the right.
 */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const profile = useResource(() => api.getMyProfile(), []);
  const [version, setVersion] = useState(0);
  const refreshPreview = useCallback(() => setVersion((v) => v + 1), []);
  const toast = useToast();

  const username = user!.username;
  const url = pageUrl(username);
  const name = profile.data?.displayName ?? username;
  const photo = profile.data?.avatarUrl || profile.data?.heroImageUrl;
  const tint = headerTint(profile.data?.appearance.colors.background ?? "#2a2a2a");

  async function copy() {
    await navigator.clipboard?.writeText(url.href);
    toast("Link copied", { tone: "success" });
  }

  return (
    <AdminContext.Provider value={{ profile, refreshPreview }}>
      <div className="shell" style={{ "--host-tint": tint } as CSSProperties}>
        <aside className="shell-side">
          <div className="shell-panel shell-nav">
            <Logo to="/admin" />
            <nav aria-label="Dashboard">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className="shell-link">
                  <Icon name={n.icon} size={22} />
                  <span>{n.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="shell-panel shell-page">
            <p className="shell-page-label">Your page</p>
            <a className="shell-page-card" href={url.href} target="_blank" rel="noreferrer">
              <CoverArt src={photo} name={name} icon="users" size={48} />
              <span>
                <b>{name}</b>
                <small>{url.label}</small>
              </span>
            </a>
            <div className="shell-page-actions">
              <button type="button" className="shell-chip" onClick={copy}>
                <Icon name="copy" size={16} /> Copy link
              </button>
              <a className="shell-chip" href={url.href} target="_blank" rel="noreferrer">
                <Icon name="external" size={16} /> Open
              </a>
            </div>
            <p className="shell-live">
              <span className="live-dot" aria-hidden="true" /> Live for anyone with the link
            </p>
          </div>
        </aside>

        <div className="shell-panel shell-main">
          <header className="shell-top">
            <span className="shell-top-handle">@{username}</span>
            <ThemeToggle />
            <Menu
              label="Account"
              trigger={
                <span className="shell-avatar" aria-hidden="true">
                  {photo ? <img src={photo} alt="" /> : name.slice(0, 1).toUpperCase()}
                </span>
              }
              items={[
                { label: "View your page", icon: "external", onSelect: () => window.open(url.href, "_blank", "noreferrer") },
                { label: "Copy link", icon: "copy", onSelect: copy },
                { label: "Log out", icon: "logout", onSelect: logout },
              ]}
            />
          </header>
          <div className="shell-content">
            <Outlet />
          </div>
        </div>

        <aside className="shell-panel shell-preview" aria-label="Live preview">
          <div className="shell-preview-head">
            <b>Preview</b>
            <span>What visitors see</span>
          </div>
          <PhoneFrame username={username} version={version} />
        </aside>
      </div>
    </AdminContext.Provider>
  );
}
