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
  okBg: "#e3f4ea",
  danger: "#c4243f",
  dangerBg: "#fdecef",
  white: "#ffffff",
};

/** A host's page colours before their profile loads (the Aubergine preset). */
export const DEFAULT_THEME: ThemeColors = {
  background: brand.plum,
  text: "#ffffff",
  card: brand.paper,
  cardText: brand.plum,
  accent: brand.pink,
};

/** One spacing scale for every screen (4-pt grid). */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** One radius per kind of surface, so cards, inputs and buttons look like a family. */
export const radius = { sm: 10, input: 12, card: 20, pill: 999 } as const;

/** Soft plum-tinted shadows, never grey on the cream base. */
export const shadow = {
  card: { shadowColor: "#2a0f3d", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  float: { shadowColor: "#2a0f3d", shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  pink: { shadowColor: "#ff3d7f", shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
} as const;

/** Type scale. Body text never goes below 15 so it stays readable on a phone. */
export const type = {
  display: { fontSize: 34, lineHeight: 38, fontWeight: "800", letterSpacing: -0.8 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "800" },
  section: { fontSize: 13, lineHeight: 18, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  body: { fontSize: 16, lineHeight: 23 },
  small: { fontSize: 13, lineHeight: 18 },
} as const;

export const tokens = {
  gutter: space.lg,
  radiusCard: radius.card,
  radiusPill: radius.pill,
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

/**
 * Colours for text and translucent panels drawn straight on a host's page
 * background. Works for light and dark themes alike, so nothing is ever
 * white-on-cream or black-on-plum.
 */
export function onBackground(theme: ThemeColors) {
  const dark = isDark(theme.background);
  return {
    text: theme.text,
    muted: dark ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.62)",
    surface: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
    border: dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.12)",
    error: dark ? "#ffb4ab" : brand.danger,
    statusBar: dark ? ("light" as const) : ("dark" as const),
  };
}

/** Public-page screens provide the host's colours; everything else gets the default. */
export const ThemeContext = createContext<ThemeColors>(DEFAULT_THEME);
export const useTheme = () => useContext(ThemeContext);
