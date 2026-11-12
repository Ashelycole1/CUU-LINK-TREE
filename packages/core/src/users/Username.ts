import { ValueObject } from "../shared/Entity";
import { ValidationError } from "../shared/errors";

/**
 * The handle in a public URL (`/jazzfest`). Lower-case letters, digits,
 * dots and underscores, 3–30 characters. Names that would clash with app
 * routes are reserved.
 */
export class Username extends ValueObject<{ value: string }> {
  static readonly PATTERN = /^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])$/;
  static readonly RESERVED = new Set([
    "admin", "api", "app", "assets", "dashboard", "explore", "help", "login", "logout",
    "new", "settings", "signup", "static", "support", "u", "e", "www", "about", "pricing",
  ]);

  private constructor(value: string) {
    super({ value });
  }

  static of(raw: unknown): Username {
    const value = String(raw ?? "").trim().toLowerCase().replace(/^@/, "");
    if (!Username.PATTERN.test(value)) {
      throw new ValidationError(
        "Usernames are 3–30 characters: letters, numbers, dots and underscores, starting and ending with a letter or number.",
        "username",
      );
    }
    if (Username.RESERVED.has(value)) throw new ValidationError(`"${value}" is reserved. Pick another username.`, "username");
    return new Username(value);
  }

  get value(): string {
    return this.props.value;
  }

  override toString(): string {
    return this.props.value;
  }
}
