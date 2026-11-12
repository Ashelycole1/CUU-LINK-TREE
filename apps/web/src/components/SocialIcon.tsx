import type { SocialLinkDTO } from "@event-tree/api-client";

const LABELS: Record<SocialLinkDTO["platform"], string> = {
  instagram: "IG",
  x: "X",
  linkedin: "in",
  whatsapp: "WA",
  youtube: "YT",
  tiktok: "TT",
  facebook: "f",
  website: "🌐",
};

/** Compact monogram icons; no icon font or brand assets needed. */
export function SocialIcon({ platform }: { platform: SocialLinkDTO["platform"] }) {
  return <span className="social-icon">{LABELS[platform]}</span>;
}
