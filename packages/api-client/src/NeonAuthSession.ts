import { ApiError } from "./ApiError";
import type { FetchLike } from "./HttpTransport";

/** Where the session value is kept between app launches (SecureStore on mobile). */
export interface SessionStore {
  load(): Promise<string | null>;
  save(value: string | null): Promise<void>;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface NeonAuthSessionOptions {
  /** The Event Tree server; Neon Auth is reached through its /api/auth proxy. */
  baseUrl: string;
  store: SessionStore;
  fetch?: FetchLike;
  timeoutMs?: number;
}

/** Must match apps/api/src/http/authProxy.ts. */
const TRANSPORT_HEADER = "x-auth-transport";
const SESSION_HEADER = "x-auth-session";

/**
 * Neon Auth (Managed Better Auth) for apps without a browser cookie jar,
 * such as the React Native app. It calls the same Better Auth endpoints as
 * the web SDK, through our server's /api/auth proxy, and keeps the session
 * in a SessionStore instead of a cookie. `token()` returns the short-lived
 * JWT the Event Tree API expects, refreshing it before it expires.
 */
export class NeonAuthSession {
  static readonly PATH = "/api/auth";
  private readonly url: string;
  private readonly fetchImpl: FetchLike;
  private session: string | null | undefined;
  private jwt: { value: string; expiresAt: number } | null = null;
  private pendingToken: Promise<string | null> | null = null;

  constructor(private readonly options: NeonAuthSessionOptions) {
    this.url = options.baseUrl.replace(/\/+$/, "") + NeonAuthSession.PATH;
    this.fetchImpl = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  }

  /**
   * Creates the account. When email verification is required, no session
   * comes back (`verified: false`): the person must enter the emailed code
   * with verifyEmail() before they are signed in.
   */
  async signUp(input: { email: string; password: string; name: string }): Promise<{ user: AuthUser; verified: boolean }> {
    const data = await this.call<{ user: AuthUser; token?: string | null }>("POST", "/sign-up/email", input);
    return { user: data.user, verified: Boolean(data.token) };
  }

  /** Checks the emailed sign-up code. Signs the person in when it is right. */
  async verifyEmail(input: { email: string; otp: string }): Promise<void> {
    await this.call("POST", "/email-otp/verify-email", input);
  }

  /** Emails a new sign-up code (codes expire after 15 minutes). */
  async sendVerificationCode(email: string): Promise<void> {
    await this.call("POST", "/email-otp/send-verification-otp", { email, type: "email-verification" });
  }

  async signIn(input: { email: string; password: string }): Promise<AuthUser> {
    return (await this.call<{ user: AuthUser }>("POST", "/sign-in/email", input)).user;
  }

  async signOut(): Promise<void> {
    try {
      if (await this.current()) await this.call("POST", "/sign-out", {});
    } finally {
      await this.setSession(null);
    }
  }

  /** The signed-in person, or null. */
  async getUser(): Promise<AuthUser | null> {
    if (!(await this.current())) return null;
    const data = await this.call<{ user?: AuthUser } | null>("GET", "/get-session");
    if (!data?.user) await this.setSession(null);
    return data?.user ?? null;
  }

  /** A JWT for `Authorization: Bearer` on the Event Tree API, or null when signed out. */
  token(): Promise<string | null> {
    if (this.jwt && this.jwt.expiresAt - 60_000 > Date.now()) return Promise.resolve(this.jwt.value);
    // One refresh at a time, however many requests are waiting for it.
    this.pendingToken ??= this.refreshToken().finally(() => {
      this.pendingToken = null;
    });
    return this.pendingToken;
  }

  private async refreshToken(): Promise<string | null> {
    if (!(await this.current())) return null;
    try {
      const { token } = await this.call<{ token: string }>("GET", "/token");
      this.jwt = { value: token, expiresAt: expiryOf(token) };
      return token;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await this.setSession(null);
        return null;
      }
      throw error;
    }
  }

  private async current(): Promise<string | null> {
    if (this.session === undefined) this.session = await this.options.store.load().catch(() => null);
    return this.session;
  }

  private async setSession(value: string | null): Promise<void> {
    if (value === this.session) return;
    this.session = value;
    this.jwt = null;
    await this.options.store.save(value).catch(() => undefined);
  }

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { accept: "application/json", [TRANSPORT_HEADER]: "session" };
    if (body !== undefined) headers["content-type"] = "application/json";
    const session = await this.current();
    if (session) headers[SESSION_HEADER] = session;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 15_000);
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.url}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      const aborted = (error as Error)?.name === "AbortError";
      throw new ApiError(0, aborted ? "TIMEOUT" : "NETWORK", aborted ? "Sign-in took too long to answer." : "Could not reach the server.");
    } finally {
      clearTimeout(timer);
    }

    const next = res.headers.get(SESSION_HEADER);
    if (next !== null) await this.setSession(next || null);

    const payload: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const err = payload as { code?: string; message?: string } | null;
      throw new ApiError(res.status, err?.code ?? "AUTH_ERROR", friendlyAuthMessage(err?.code, err?.message ?? `Sign-in failed (${res.status}).`));
    }
    return payload as T;
  }
}

/** Reads `exp` from a JWT without verifying it (the server verifies). Falls back to 5 minutes. */
function expiryOf(jwt: string): number {
  try {
    const part = jwt.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), "="))) as { exp?: number };
    if (typeof exp === "number") return exp * 1000;
  } catch {
    // fall through
  }
  return Date.now() + 5 * 60_000;
}

/** Better Auth's code for an account whose email hasn't been confirmed yet. */
export const EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED";

/** Better Auth's error codes, in the app's own words. */
export function friendlyAuthMessage(code: string | undefined, fallback: string): string {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "There is already an account with that email. Log in instead.";
    case "PASSWORD_TOO_SHORT":
      return "Use at least 8 characters for your password.";
    case "INVALID_EMAIL":
      return "Enter a valid email address.";
    case EMAIL_NOT_VERIFIED:
      return "Enter the code we emailed you to finish signing up.";
    case "INVALID_OTP":
      return "That code isn't right. Check the email and try again.";
    case "OTP_EXPIRED":
      return "That code has expired. Send a new one.";
    case "TOO_MANY_ATTEMPTS":
      return "Too many wrong codes. Send a new one.";
    default:
      return fallback;
  }
}
