import { ConflictError, UnauthorizedError, ValidationError } from "../shared/errors";
import type { Clock, IdGenerator } from "../shared/ports";
import type { AuthSessionDTO, LoginInput, SignupInput, UserDTO } from "../dto";
import { Profile, type ProfileRepository } from "../profile/Profile";
import { User, type PasswordHasher, type TokenService, type UserRepository } from "./User";
import { Username } from "./Username";

/** Sign up, log in, and resolve a session token to a user. */
export class AuthService {
  static readonly MIN_PASSWORD = 8;

  constructor(
    private readonly users: UserRepository,
    private readonly profiles: ProfileRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
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

  async signup(input: SignupInput): Promise<AuthSessionDTO> {
    const password = String(input.password ?? "");
    if (password.length < AuthService.MIN_PASSWORD) {
      throw new ValidationError(`Passwords need at least ${AuthService.MIN_PASSWORD} characters.`, "password");
    }
    const email = User.normaliseEmail(input.email);
    const username = Username.of(input.username).value;
    if (await this.users.findByEmail(email)) throw new ConflictError("An account with that email already exists. Log in instead.", "email");
    if (await this.users.findByUsername(username)) throw new ConflictError("That username is taken.", "username");

    const user = User.create({ email, username, passwordHash: await this.hasher.hash(password) }, { id: this.ids.next(), now: this.clock.now() });
    await this.users.save(user);
    await this.profiles.save(Profile.createFor(user.id, username, input.displayName));
    return { token: this.tokens.issue(user.id), user: user.toDTO() };
  }

  async login(input: LoginInput): Promise<AuthSessionDTO> {
    const user = await this.users.findByEmail(String(input.email ?? "").trim().toLowerCase());
    // Same message for unknown email and wrong password, so accounts can't be probed.
    const ok = user ? await this.hasher.verify(String(input.password ?? ""), user.hash) : false;
    if (!user || !ok) throw new UnauthorizedError("That email and password don't match an account.");
    return { token: this.tokens.issue(user.id), user: user.toDTO() };
  }

  /** Resolves a bearer token. Throws UnauthorizedError when it is missing or invalid. */
  async authenticate(token: string | null | undefined): Promise<UserDTO> {
    const userId = token ? this.tokens.verify(token) : null;
    const user = userId ? await this.users.findById(userId) : null;
    if (!user) throw new UnauthorizedError();
    return user.toDTO();
  }
}
