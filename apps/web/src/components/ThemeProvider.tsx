import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { ProfileDTO } from "@event-tree/api-client";
import { api } from "../lib/api";
import { useResource, type Resource } from "../lib/useResource";

const ProfileContext = createContext<Resource<ProfileDTO> | null>(null);

/**
 * Loads the tree's profile once and turns its theme into CSS custom
 * properties, the way Linktree applies `theme.colors` to the page.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const profile = useResource(() => api().getProfile(), []);

  useEffect(() => {
    const theme = profile.data?.theme;
    if (!theme) return;
    const root = document.documentElement.style;
    root.setProperty("--bg", theme.background);
    root.setProperty("--on-bg", theme.text);
    root.setProperty("--card", theme.card);
    root.setProperty("--ink", theme.cardText);
    root.setProperty("--accent", theme.accent);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.background);
    document.title = profile.data?.name ?? "Event Tree";
  }, [profile.data]);

  return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>;
}

export function useProfile(): Resource<ProfileDTO> {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useProfile must be used inside <ThemeProvider>.");
  return value;
}
