import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const KEY = "et-theme";

/** The visitor's saved choice, or null to follow the system setting. */
function saved(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function system(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#fbfbfa" : "#121212");
}

/**
 * Light or dark. Follows the system until the visitor picks one, then
 * remembers their pick in this browser. index.html sets the first value
 * before React loads, so there is no flash.
 */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) || saved() || system());

  useEffect(() => {
    apply(theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!mq) return;
    const follow = () => {
      if (!saved()) setTheme(mq.matches ? "light" : "dark");
    };
    mq.addEventListener("change", follow);
    return () => mq.removeEventListener("change", follow);
  }, []);

  // Keep every toggle on the page (and other tabs) in step.
  useEffect(() => {
    const sync = () => setTheme((document.documentElement.dataset.theme as Theme) || system());
    window.addEventListener("et-theme", sync);
    return () => window.removeEventListener("et-theme", sync);
  }, []);

  const choose = (t: Theme) => {
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* private mode: the choice lasts for this page only */
    }
    apply(t);
    setTheme(t);
    window.dispatchEvent(new Event("et-theme"));
  };

  return [theme, choose];
}
