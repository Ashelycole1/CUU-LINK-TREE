import { Entity } from "../shared/Entity";
import { ValidationError } from "../shared/errors";
import { Guard } from "../shared/guards";
import type { UserDTO, UserRecord } from "../dto";
import { Username } from "./Username";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A host: the link between a Neon Auth identity and one public event page.
 * Neon Auth owns the email, password and sessions; this entity only records
 * which username (and so which page) belongs to that identity. Its id is the
 * Neon Auth user id (the JWT `sub`).
 */
export class User extends Entity {
  private constructor(
    id: string,
    readonly email: string,
    readonly username: Username,
    readonly createdAt: Date,
  ) {
    super(id);
  }

  static normaliseEmail(raw: unknown): string {
    const email = String(raw ?? "").trim().toLowerCase();
    if (!EMAIL.test(email) || email.length > 254) throw new ValidationError("Enter a valid email address.", "email");
    return email;
  }

  static create(input: { id: string; email: unknown; username: unknown }, now: Date): User {
    return new User(Guard.text(input.id, "id", { min: 1, max: 128 }), User.normaliseEmail(input.email), Username.of(input.username), now);
  }

  static restore(record: UserRecord): User {
    return new User(record.id, User.normaliseEmail(record.email), Username.of(record.username), Guard.date(record.createdAt, "createdAt"));
  }

  toRecord(): UserRecord {
    return { id: this.id, email: this.email, username: this.username.value, createdAt: this.createdAt.toISOString() };
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

/** Who a verified token belongs to. */
export interface Identity {
  /** Neon Auth user id (the JWT `sub`). */
  id: string;
  email: string;
  name?: string;
}

/**
 * Port for checking a sign-in token. The API implements it by verifying a
 * Neon Auth JWT against the branch's JWKS; tests use a fake.
 */
export interface IdentityVerifier {
  /** Returns the identity, or null for a missing, forged or expired token. */
  verify(token: string): Promise<Identity | null>;
}
