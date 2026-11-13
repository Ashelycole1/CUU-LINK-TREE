import { ConflictError, PageRequiredError, UnauthorizedError } from "../shared/errors";
import type { Clock } from "../shared/ports";
import type { ClaimPageInput, MeDTO, UserDTO } from "../dto";
import { Profile, type ProfileRepository } from "../profile/Profile";
import { User, type Identity, type IdentityVerifier, type UserRepository } from "./User";
import { Username } from "./Username";

/**
 * Accounts on top of Neon Auth. Neon Auth handles sign-up, sign-in,
 * passwords and sessions; this service turns a verified sign-in token into
 * a host, and lets a signed-in person claim a username (which creates
 * their page).
 */
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly profiles: ProfileRepository,
    private readonly identities: IdentityVerifier,
    private readonly clock: Clock,
  ) {}

  /** For the "claim your username" box: true when the name is valid and free. */
  async isUsernameAvailable(raw: string): Promise<{ username: string; available: boolean; reason?: string }> {
    try {
      const username = Username.of(raw).value;
      const taken = await this.users.findByUsername(username);
      return taken ? { username, available: false, reason: "That username is taken." } : { username, available: true };
    } catch (error) {
      return { username: String(raw), available: false, reason: (error as Error).message };
    }
  }

  /** Verifies a sign-in token. Throws UnauthorizedError when it is missing or invalid. */
  async identify(token: string | null | undefined): Promise<Identity> {
    const identity = token ? await this.identities.verify(token) : null;
    if (!identity) throw new UnauthorizedError();
    return identity;
  }

  /** The signed-in person, and their page if they have claimed one. */
  async me(token: string | null | undefined): Promise<MeDTO> {
    const identity = await this.identify(token);
    const user = await this.users.findById(identity.id);
    return { identity: { id: identity.id, email: identity.email }, user: user?.toDTO() ?? null };
  }

  /** Claims a username for the signed-in person and creates their page. */
  async claim(token: string | null | undefined, input: ClaimPageInput): Promise<UserDTO> {
    const identity = await this.identify(token);
    if (await this.users.findById(identity.id)) throw new ConflictError("You already have a page.", "username");
    const username = Username.of(input.username).value;
    if (await this.users.findByUsername(username)) throw new ConflictError("That username is taken.", "username");

    const user = User.create({ id: identity.id, email: identity.email, username }, this.clock.now());
    await this.users.save(user);
    const displayName = String(input.displayName ?? "").trim() || identity.name?.trim() || username;
    await this.profiles.save(Profile.createFor(user.id, username, displayName));
    return user.toDTO();
  }

  /**
   * Resolves a token to a host with a page. Throws UnauthorizedError without
   * a valid token, and PageRequiredError when the person has not claimed a
   * username yet.
   */
  async authenticate(token: string | null | undefined): Promise<UserDTO> {
    const identity = await this.identify(token);
    const user = await this.users.findById(identity.id);
    if (!user) throw new PageRequiredError();
    return user.toDTO();
  }
}
