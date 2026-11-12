import type { ProfileDTO } from "@event-tree/api-client";
import { SocialIcon } from "./SocialIcon";

interface Props {
  profile: ProfileDTO;
  upcomingCount: number;
}

/** Hero art (or round avatar), name, bio, social icons and the "N upcoming" badge. */
export function ProfileHeader({ profile, upcomingCount }: Props) {
  return (
    <header className="profile">
      {profile.heroImageUrl ? (
        <img className="hero" src={profile.heroImageUrl} alt="" width={1160} height={518} />
      ) : (
        <div className="avatar" aria-hidden="true">
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : profile.avatarText || profile.name.slice(0, 2)}
        </div>
      )}
      <h1>{profile.name}</h1>
      {profile.handle && <p className="handle">{profile.handle}</p>}
      {profile.bio && <p className="bio">{profile.bio}</p>}
      {profile.socials.length > 0 && (
        <nav className="socials" aria-label="Social links">
          {profile.socials.map((s) => (
            <a key={s.platform} href={s.url} target="_blank" rel="noreferrer" aria-label={s.platform}>
              <SocialIcon platform={s.platform} />
            </a>
          ))}
        </nav>
      )}
      <p className="pill">
        <span className="dot" /> {upcomingCount} upcoming
      </p>
    </header>
  );
}
