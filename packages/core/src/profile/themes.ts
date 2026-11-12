import type { ThemePreset } from "../dto";

/**
 * Preset looks for a public page, like Linktree's theme gallery. Each one
 * sets colours, button style and font together; hosts can then change any
 * single value under Appearance.
 */
export const THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: "aubergine",
    name: "Aubergine",
    colors: { background: "#2a0f3d", text: "#fffaf2", card: "#fffaf2", cardText: "#2a0f3d", accent: "#ff3d7f" },
    buttonStyle: "ticket",
    font: "bricolage",
  },
  {
    id: "gig-poster",
    name: "Gig poster",
    colors: { background: "#ffc928", text: "#1d1033", card: "#1d1033", cardText: "#ffc928", accent: "#ff3d7f" },
    buttonStyle: "shadow",
    font: "bricolage",
  },
  {
    id: "stage-blue",
    name: "Stage blue",
    colors: { background: "#3a5cff", text: "#ffffff", card: "#ffffff", cardText: "#1a2a99", accent: "#ffc928" },
    buttonStyle: "ticket",
    font: "figtree",
  },
  {
    id: "programme",
    name: "Programme",
    colors: { background: "#fffaf2", text: "#2a0f3d", card: "#ffffff", cardText: "#2a0f3d", accent: "#3a5cff" },
    buttonStyle: "outline",
    font: "fraunces",
  },
  {
    id: "wristband",
    name: "Wristband",
    colors: { background: "#ff3d7f", text: "#ffffff", card: "#ffffff", cardText: "#8a0d3b", accent: "#2a0f3d" },
    buttonStyle: "pill",
    font: "figtree",
  },
  {
    id: "after-hours",
    name: "After hours",
    colors: { background: "#14112b", text: "#e9e4ff", card: "#262147", cardText: "#ffffff", accent: "#7cf3ff" },
    buttonStyle: "pill",
    font: "bricolage",
  },
];

export const DEFAULT_THEME_ID = "aubergine";

export function findTheme(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((t) => t.id === id);
}
