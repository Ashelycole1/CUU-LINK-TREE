import { Entity } from "../shared/Entity";
import { ValidationError } from "../shared/errors";
import { Guard } from "../shared/guards";
import type { UserDTO, UserRecord } from "../dto";
import { Username } from "./Username";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** An account that owns one public event page. The password hash never leaves the server. */
export class User extends Entity {
  private constructor(
    id: string,
    readonly email: string,
    readonly username: Username,
    private readonly passwordHash: string,
    readonly createdAt: Date,
  ) {
    super(id);
  }

  static normaliseEmail(raw: unknown): string {
    const email = String(raw ?? "").trim().toLowerCase();
    if (!EMAIL.test(email) || email.length > 254) throw new ValidationError("Enter a valid email address.", "email");
    return email;
  }

  static create(input: { email: unknown; username: unknown; passwordHash: string }, ctx: { id: string; now: Date }): User {
    return new User(ctx.id, User.normaliseEmail(input.email), Username.of(input.username), input.passwordHash, ctx.now);
  }

  static restore(record: UserRecord): User {
    return new User(
      record.id,
      User.normaliseEmail(record.email),
      Username.of(record.username),
      record.passwordHash,
      Guard.date(record.createdAt, "createdAt"),
    );
  }

  /** Exposed only to the AuthService for verification. */
  get hash(): string {
    return this.passwordHash;
  }

  toRecord(): UserRecord {
    return {
      id: this.id,
      email: this.email,
      username: this.username.value,
      passwordHash: this.passwordHash,
      createdAt: this.createdAt.toISOString(),
    };
  }

  toDTO(): UserDTO {
    return { id: this.id, email: this.email, username: this.username.value, createdAt: this.createdAt.toISOString() };
  }
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

/** Ports implemented by the server (scrypt, HMAC). The domain never sees raw crypto. */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export interface TokenService {
  issue(userId: string): string;
  /** Returns the user id, or null for a missing, forged or expired token. */
  verify(token: string): string | null;
}
