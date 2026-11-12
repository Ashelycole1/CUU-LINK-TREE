import { ValidationError } from "../shared/errors";
import { Guard } from "../shared/guards";
import type {
  AppearanceDTO,
  ButtonStyle,
  FontChoice,
  ProfileDTO,
  SocialLinkDTO,
  ThemeColors,
  UpdateProfileInput,
} from "../dto";
import { Username } from "../users/Username";
import { DEFAULT_THEME_ID, findTheme, THEME_PRESETS } from "./themes";

const PLATFORMS: readonly SocialLinkDTO["platform"][] = [
  "instagram", "x", "linkedin", "whatsapp", "youtube", "tiktok", "facebook", "website",
];
const BUTTON_STYLES: readonly ButtonStyle[] = ["ticket", "pill", "outline", "shadow"];
const FONTS: readonly FontChoice[] = ["bricolage", "figtree", "fraunces"];
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function defaultAppearance(): AppearanceDTO {
  const t = findTheme(DEFAULT_THEME_ID) ?? THEME_PRESETS[0]!;
  return { themeId: t.id, colors: { ...t.colors }, buttonStyle: t.buttonStyle, font: t.font };
}

/**
 * A host's public page: name, bio, avatar, socials and appearance.
 * Mirrors Linktree's `account` (pageTitle, description, profilePictureUrl,
 * socialLinks) and `theme`. Immutable: `update()` returns a new Profile.
 */
export class Profile {
  private constructor(private readonly data: ProfileDTO) {}

  /** A fresh page for a new account. */
  static createFor(ownerId: string, username: string, displayName?: string): Profile {
    return Profile.restore({
      ownerId,
      username,
      displayName: displayName?.trim() || username,
      bio: "",
      avatarUrl: "",
      heroImageUrl: "",
      socials: [],
      appearance: defaultAppearance(),
    });
  }

  static restore(data: ProfileDTO): Profile {
    return new Profile({
      ownerId: Guard.text(data.ownerId, "ownerId", { min: 1, max: 64 }),
      username: Username.of(data.username).value,
      displayName: Guard.text(data.displayName, "Display name", { min: 1, max: 60 }),
      bio: Guard.optionalText(data.bio, "Bio", 280),
      avatarUrl: data.avatarUrl ? Guard.httpUrl(data.avatarUrl, "Profile image") : "",
      heroImageUrl: data.heroImageUrl ? Guard.httpUrl(data.heroImageUrl, "Header image") : "",
      socials: Profile.validateSocials(data.socials ?? []),
      appearance: Profile.validateAppearance(data.appearance ?? defaultAppearance()),
    });
  }

  private static validateSocials(socials: SocialLinkDTO[]): SocialLinkDTO[] {
    Guard.maxItems(socials, "Social links", PLATFORMS.length);
    return socials.map((s) => {
      if (!PLATFORMS.includes(s.platform)) throw new ValidationError(`Unknown social platform "${s.platform}".`, "socials");
      return { platform: s.platform, url: Guard.httpUrl(s.url, `${s.platform} link`) };
    });
  }

  private static validateAppearance(a: AppearanceDTO): AppearanceDTO {
    if (!BUTTON_STYLES.includes(a.buttonStyle)) throw new ValidationError("Unknown button style.", "appearance.buttonStyle");
    if (!FONTS.includes(a.font)) throw new ValidationError("Unknown font.", "appearance.font");
    const colors = { ...a.colors };
    for (const [key, value] of Object.entries(colors)) {
      if (!HEX.test(value)) throw new ValidationError(`Colour "${key}" must be a hex colour like #2a0f3d.`, `appearance.colors.${key}`);
    }
    return { themeId: String(a.themeId || "custom"), colors: colors as ThemeColors, buttonStyle: a.buttonStyle, font: a.font };
  }

  get ownerId(): string {
    return this.data.ownerId;
  }

  get username(): string {
    return this.data.username;
  }

  /**
   * Applies a partial change. Picking a theme resets colours, button style
   * and font to that preset; any values sent alongside it override the preset.
   */
  update(patch: UpdateProfileInput): Profile {
    const current = this.data.appearance;
    let appearance: AppearanceDTO = current;
    if (patch.appearance) {
      const preset = patch.appearance.themeId ? findTheme(patch.appearance.themeId) : undefined;
      const base: AppearanceDTO = preset
        ? { themeId: preset.id, colors: { ...preset.colors }, buttonStyle: preset.buttonStyle, font: preset.font }
        : current;
      const colorsChanged = !!patch.appearance.colors && Object.keys(patch.appearance.colors).length > 0;
      appearance = {
        themeId: colorsChanged ? "custom" : base.themeId,
        colors: { ...base.colors, ...(patch.appearance.colors ?? {}) },
        buttonStyle: patch.appearance.buttonStyle ?? base.buttonStyle,
        font: patch.appearance.font ?? base.font,
      };
    }
    return Profile.restore({
      ...this.data,
      displayName: patch.displayName ?? this.data.displayName,
      bio: patch.bio ?? this.data.bio,
      avatarUrl: patch.avatarUrl ?? this.data.avatarUrl,
      heroImageUrl: patch.heroImageUrl ?? this.data.heroImageUrl,
      socials: patch.socials ?? this.data.socials,
      appearance,
    });
  }

  toDTO(): ProfileDTO {
    return structuredClone(this.data);
  }
}

export interface ProfileRepository {
  findByOwner(ownerId: string): Promise<Profile | null>;
  findByUsername(username: string): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
}
