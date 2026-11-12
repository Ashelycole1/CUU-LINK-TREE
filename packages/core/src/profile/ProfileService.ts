import { NotFoundError } from "../shared/errors";
import type { ProfileDTO, ThemePreset, UpdateProfileInput } from "../dto";
import type { ProfileRepository } from "./Profile";
import { THEME_PRESETS } from "./themes";

/** The host's own page settings: header, socials and appearance. */
export class ProfileService {
  constructor(private readonly profiles: ProfileRepository) {}

  themes(): ThemePreset[] {
    return THEME_PRESETS.map((t) => structuredClone(t));
  }

  async getMine(ownerId: string): Promise<ProfileDTO> {
    const profile = await this.profiles.findByOwner(ownerId);
    if (!profile) throw new NotFoundError("Profile", ownerId);
    return profile.toDTO();
  }

  async updateMine(ownerId: string, patch: UpdateProfileInput): Promise<ProfileDTO> {
    const profile = await this.profiles.findByOwner(ownerId);
    if (!profile) throw new NotFoundError("Profile", ownerId);
    const next = profile.update(patch ?? {});
    await this.profiles.save(next);
    return next.toDTO();
  }
}
