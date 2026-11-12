import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { PasswordHasher, TokenService } from "@event-tree/core";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

/** scrypt with a random 16-byte salt per password. Stored as "scrypt$<salt hex>$<hash hex>". */
export class ScryptPasswordHasher implements PasswordHasher {
  private static readonly KEY_LENGTH = 64;

  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await scrypt(password, salt, ScryptPasswordHasher.KEY_LENGTH);
    return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [scheme, saltHex, keyHex] = stored.split("$");
    if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
    const expected = Buffer.from(keyHex, "hex");
    const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}

/**
 * Stateless session tokens: base64url(JSON {sub, exp}) + "." + HMAC-SHA256.
 * Sent by clients as `Authorization: Bearer <token>`.
 */
export class HmacTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly ttlSeconds = 60 * 60 * 24 * 30,
    private readonly now: () => number = () => Date.now(),
  ) {
    if (secret.length < 16) throw new Error("AUTH_SECRET must be at least 16 characters.");
  }

  issue(userId: string): string {
    const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(this.now() / 1000) + this.ttlSeconds })).toString("base64url");
    return `${payload}.${this.sign(payload)}`;
  }

  verify(token: string): string | null {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = Buffer.from(this.sign(payload));
    const given = Buffer.from(signature);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    try {
      const { sub, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; exp?: number };
      if (!sub || !exp || exp * 1000 < this.now()) return null;
      return sub;
    } catch {
      return null;
    }
  }

  private sign(payload: string): string {
    return createHmac("sha256", this.secret).update(payload).digest("base64url");
  }
}
