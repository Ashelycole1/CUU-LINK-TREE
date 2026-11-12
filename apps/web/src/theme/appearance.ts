import type { CSSProperties } from "react";
import type { AppearanceDTO, FontChoice } from "@event-tree/api-client";

export const FONT_STACKS: Record<FontChoice, string> = {
  bricolage: '"Bricolage Grotesque", "Figtree", system-ui, sans-serif',
  figtree: '"Figtree", system-ui, sans-serif',
  fraunces: '"Fraunces", Georgia, serif',
};

export const FONT_LABELS: Record<FontChoice, string> = {
  bricolage: "Bricolage Grotesque",
  figtree: "Figtree",
  fraunces: "Fraunces",
};

/**
 * Turns a host's appearance into CSS custom properties for the public page.
 * The page stylesheet reads only these variables, so every theme, button
 * style and font is the same markup with different values.
 */
export function appearanceStyle(a: AppearanceDTO): CSSProperties {
  return {
    "--t-bg": a.colors.background,
    "--t-text": a.colors.text,
    "--t-card": a.colors.card,
    "--t-card-text": a.colors.cardText,
    "--t-accent": a.colors.accent,
    "--t-font": FONT_STACKS[a.font],
  } as CSSProperties;
}
