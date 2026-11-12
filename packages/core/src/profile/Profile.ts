import { ValidationError } from "../shared/errors";
import { Guard } from "../shared/guards";
import type { ProfileDTO, SocialLinkDTO, ThemeDTO } from "../dto";

const PLATFORMS: readonly SocialLinkDTO["platform"][] = [
  "instagram",
  "x",
  "linkedin",
  "whatsapp",
  "youtube",
  "tiktok",
  "facebook",
  "website",
];

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export const DEFAULT_THEME: ThemeDTO = {
  background: "#1d2c56",
  text: "#ffffff",
  card: "#ffffff",
  cardText: "#14160e",
  accent: "#f5b62e",
};

/**
 * The owner of the tree: name, bio, avatar, socials and theme. Matches
 * Linktree's `account` (pageTitle, description, profilePictureUrl,
 * socialLinks) and its `theme.colors`.
 */
export class Profile {
  private constructor(private readonly data: ProfileDTO) {}

  static create(input: Partial<ProfileDTO>): Profile {
    const theme = { ...DEFAULT_THEME, ...(input.theme ?? {}) };
    for (const [key, value] of Object.entries(theme)) {
      if (!HEX.test(value)) throw new ValidationError(`Theme colour "${key}" must be a hex colour.`, `theme.${key}`);
    }
    const socials = (input.socials ?? []).map((s) => {
      if (!PLATFORMS.includes(s.platform)) {
        throw new ValidationError(`Unknown social platform "${s.platform}".`, "socials");
      }
      return { platform: s.platform, url: Guard.httpUrl(s.url, `${s.platform} link`) };
    });
    return new Profile({
      name: Guard.text(input.name, "Name", { min: 1, max: 60 }),
      handle: Guard.optionalText(input.handle, "Handle", 40),
      bio: Guard.optionalText(input.bio, "Bio", 280),
      avatarUrl: input.avatarUrl ? Guard.httpUrl(input.avatarUrl, "Avatar") : "",
      avatarText: Guard.optionalText(input.avatarText, "Avatar text", 4),
      heroImageUrl: input.heroImageUrl ? Guard.httpUrl(input.heroImageUrl, "Hero image") : "",
      socials,
      theme,
    });
  }

  get name(): string {
    return this.data.name;
  }

  toDTO(): ProfileDTO {
    return structuredClone(this.data);
  }
}

export interface ProfileRepository {
  get(): Promise<Profile>;
  save(profile: Profile): Promise<void>;
}
