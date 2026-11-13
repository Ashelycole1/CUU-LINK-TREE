import type { ProfileDTO } from "@event-tree/api-client";
import { SocialIcon } from "./SocialIcon";

/** Round avatar, name, handle, bio and social icons, centred like a Linktree header. */
export function ProfileHeader({ profile }: { profile: ProfileDTO }) {
  const photo = profile.avatarUrl || profile.heroImageUrl;
  const initials = profile.displayName
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="tree-header">
      <div className="tree-avatar" aria-hidden="true">
        {photo ? <img src={photo} alt="" width={96} height={96} /> : initials}
      </div>
      <h1>{profile.displayName}</h1>
      <p className="tree-handle">@{profile.username}</p>
      {profile.bio && <p className="tree-bio">{profile.bio}</p>}
      {profile.socials.length > 0 && (
        <nav className="tree-socials" aria-label="Social links">
          {profile.socials.map((s) => (
            <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.platform}>
              <SocialIcon platform={s.platform} />
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
