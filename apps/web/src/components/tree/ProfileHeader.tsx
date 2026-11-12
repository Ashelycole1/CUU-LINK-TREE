import type { ProfileDTO } from "@event-tree/api-client";
import { SocialIcon } from "./SocialIcon";

interface Props {
  profile: ProfileDTO;
  upcomingCount: number;
}

/** Header image (or round avatar), name, bio, social icons and the upcoming count. */
export function ProfileHeader({ profile, upcomingCount }: Props) {
  const initials = profile.displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="tree-header">
      {profile.heroImageUrl ? (
        <img className="tree-hero" src={profile.heroImageUrl} alt="" />
      ) : (
        <div className="tree-avatar" aria-hidden="true">
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials}
        </div>
      )}
      <h1>{profile.displayName}</h1>
      <p className="tree-handle">@{profile.username}</p>
      {profile.bio && <p className="tree-bio">{profile.bio}</p>}
      {profile.socials.length > 0 && (
        <nav className="tree-socials" aria-label="Social links">
          {profile.socials.map((s) => (
            <a key={s.platform} href={s.url} target="_blank" rel="noreferrer" aria-label={s.platform}>
              <SocialIcon platform={s.platform} />
            </a>
          ))}
        </nav>
      )}
      <p className="tree-count">
        <span className="dot" /> {upcomingCount} upcoming
      </p>
    </header>
  );
}
