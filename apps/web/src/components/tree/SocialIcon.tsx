import type { SocialLinkDTO } from "@event-tree/api-client";
import { Icon, SOCIAL_ICONS } from "../ui/Icon";

/** A round glass chip with the platform's outline mark; no icon font or brand assets needed. */
export function SocialIcon({ platform }: { platform: SocialLinkDTO["platform"] }) {
  return (
    <span className="social-icon">
      <Icon name={SOCIAL_ICONS[platform]} size={20} />
    </span>
  );
}
