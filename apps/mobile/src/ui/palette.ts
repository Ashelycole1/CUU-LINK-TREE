import { useColorScheme } from "react-native";

/**
 * Event Tree's app colours, the same values as the web tokens
 * (apps/web/src/styles/tokens.css). Yellow is the only accent; on light,
 * yellow used as text switches to a deep mustard so it stays readable.
 */
export interface Palette {
  scheme: "dark" | "light";
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceHigh: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentPressed: string;
  onAccent: string;
  accentInk: string;
  success: string;
  danger: string;
  dangerBg: string;
}

export const DARK: Palette = {
  scheme: "dark",
  bg: "#121212",
  bgElevated: "#181818",
  surface: "#242424",
  surfaceHigh: "#2e2e2e",
  border: "#2a2a2a",
  borderStrong: "#3d3d3d",
  text: "#ffffff",
  textMuted: "#b3b3b3",
  textSubtle: "#8a8a8a",
  accent: "#ffc72c",
  accentPressed: "#ffd35c",
  onAccent: "#121212",
  accentInk: "#ffc72c",
  success: "#3ddc84",
  danger: "#f15e6c",
  dangerBg: "rgba(241,94,108,0.12)",
};

export const LIGHT: Palette = {
  scheme: "light",
  bg: "#fbfbfa",
  bgElevated: "#ffffff",
  surface: "#f0f0ee",
  surfaceHigh: "#e5e5e2",
  border: "#e6e6e3",
  borderStrong: "#cbcbc7",
  text: "#121212",
  textMuted: "#4f4f4c",
  textSubtle: "#6b6b67",
  accent: "#ffc72c",
  accentPressed: "#ffb800",
  onAccent: "#121212",
  accentInk: "#8a6100",
  success: "#1b8a4f",
  danger: "#c4243f",
  dangerBg: "rgba(196,36,63,0.08)",
};

/** The palette for the phone's current light/dark setting. */
export function usePalette(): Palette {
  return useColorScheme() === "light" ? LIGHT : DARK;
}

/** 4-pt spacing and the radius family, shared with the web. */
export const gap = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const corner = { xs: 4, sm: 6, md: 8, lg: 12, pill: 999 } as const;
