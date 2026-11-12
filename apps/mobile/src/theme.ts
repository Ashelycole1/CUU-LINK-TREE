import { createContext, useContext } from "react";
import type { ThemeDTO } from "@event-tree/api-client";

/** Same tokens and measurements as the web app (apps/web/src/styles/app.css). */
export const DEFAULT_THEME: ThemeDTO = {
  background: "#1d2c56",
  text: "#ffffff",
  card: "#ffffff",
  cardText: "#14160e",
  accent: "#f5b62e",
};

export const tokens = {
  gutter: 14,
  radiusCard: 28,
  radiusPill: 64,
  glass: "rgba(255,255,255,0.16)",
  muted: "rgba(255,255,255,0.78)",
  inkMuted: "#5d6272",
  live: "#1fbf63",
  danger: "#ff8a80",
};

export const ThemeContext = createContext<ThemeDTO>(DEFAULT_THEME);
export const useTheme = () => useContext(ThemeContext);
