import { createContext, useContext } from "react";
import type { ThemeColors } from "@event-tree/api-client";

/** Event Tree's own colours, used on the home, login and dashboard screens. */
export const brand = {
  plum: "#2a0f3d",
  blue: "#3a5cff",
  pink: "#ff3d7f",
  sun: "#ffc928",
  paper: "#fffaf2",
  paper2: "#f6eee1",
  line: "#e6dccd",
  ink2: "#5d4a6c",
  ok: "#19794a",
  danger: "#c4243f",
};

/** A host's page colours before their profile loads (the Aubergine preset). */
export const DEFAULT_THEME: ThemeColors = {
  background: brand.plum,
  text: "#ffffff",
  card: brand.paper,
  cardText: brand.plum,
  accent: brand.pink,
};

export const tokens = {
  gutter: 16,
  radiusCard: 14,
  radiusPill: 64,
  glass: "rgba(255,255,255,0.14)",
  muted: "rgba(255,255,255,0.82)",
  inkMuted: "#6b5a78",
  live: "#1fbf63",
  danger: "#ff8a80",
};

/** True when light text reads better on this colour (sRGB relative luminance). Picks the status bar style. */
export function isDark(hex: string): boolean {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const l = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return l < 0.4;
}

/** Public-page screens provide the host's colours; everything else gets the default. */
export const ThemeContext = createContext<ThemeColors>(DEFAULT_THEME);
export const useTheme = () => useContext(ThemeContext);
