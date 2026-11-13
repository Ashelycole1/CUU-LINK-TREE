import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ApiError, EMAIL_NOT_VERIFIED, friendlyAuthMessage, type ClaimPageInput, type MeDTO, type UserDTO } from "@event-tree/api-client";
import { api, authClient } from "../lib/api";

interface AuthState {
  /** Signed in with Neon Auth. */
  identity: MeDTO["identity"] | null;
  /** Their page; null until they claim a username. */
  user: UserDTO | null;
  /** True until the session has been checked on first load. */
  checking: boolean;
  signIn: (input: { email: string; password: string }) => Promise<MeDTO>;
  /** Throws an ApiError with code EMAIL_NOT_VERIFIED when the emailed code must be entered first. */
  signUp: (input: { email: string; password: string; name: string }) => Promise<MeDTO>;
  /** Checks the emailed code and signs the person in. */
  verifyEmail: (input: { email: string; otp: string }) => Promise<MeDTO>;
  resendCode: (email: string) => Promise<void>;
  claim: (input: ClaimPageInput) => Promise<UserDTO>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Turns a Neon Auth (Better Auth) failure into an ApiError worded for people. */
function authError(error: unknown, fallback: string): ApiError {
  const e = (error ?? {}) as { status?: number; code?: string; message?: string; error?: { code?: string; message?: string; status?: number } };
  const code = e.code ?? e.error?.code;
  return new ApiError(e.status ?? e.error?.status ?? 0, code ?? "AUTH_ERROR", friendlyAuthMessage(code, e.message ?? e.error?.message ?? fallback));
}

/** Runs a Neon Auth call, which either throws or returns { error }. */
async function neon<T extends { error?: unknown }>(call: () => Promise<T>, fallback: string): Promise<T> {
  let result: T;
  try {
    result = await call();
  } catch (error) {
    throw authError(error, fallback);
  }
  if (result?.error) throw authError(result.error, fallback);
  return result;
}

type AuthResult = Promise<{ error?: unknown }>;

/**
 * Better Auth's email-OTP plugin. The Neon Auth SDK loads it, and its calls
 * refresh the cached session, but its public types leave it out.
 */
function emailOtp() {
  return (authClient as unknown as {
    emailOtp: {
      verifyEmail(input: { email: string; otp: string }): AuthResult;
      sendVerificationOtp(input: { email: string; type: "email-verification" }): AuthResult;
    };
  }).emailOtp;
}

/** Holds the signed-in host. Sign-in is Neon Auth; the page is ours. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeDTO | null>(null);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async (): Promise<MeDTO | null> => {
    try {
      const next = await api.me();
      setMe(next);
      return next;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setMe(null);
        return null;
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setMe(null))
      .finally(() => setChecking(false));
  }, [refresh]);

  const afterSignIn = useCallback(async () => {
    const next = await refresh();
    if (!next) throw new ApiError(401, "AUTH_ERROR", "Signed in, but the server didn't accept the session. Try again.");
    return next;
  }, [refresh]);

  const signIn = useCallback(
    async (input: { email: string; password: string }) => {
      await neon(() => authClient.signIn.email(input), "Couldn't log in.");
      return afterSignIn();
    },
    [afterSignIn],
  );

  const signUp = useCallback(
    async (input: { email: string; password: string; name: string }) => {
      const { data } = await neon(() => authClient.signUp.email(input), "Couldn't create your account.");
      // No session yet: the account exists, but the emailed code must be entered first.
      if (!data?.token) throw new ApiError(403, EMAIL_NOT_VERIFIED, friendlyAuthMessage(EMAIL_NOT_VERIFIED, ""));
      return afterSignIn();
    },
    [afterSignIn],
  );

  const verifyEmail = useCallback(
    async (input: { email: string; otp: string }) => {
      await neon(() => emailOtp().verifyEmail(input), "Couldn't check that code.");
      return afterSignIn();
    },
    [afterSignIn],
  );

  const resendCode = useCallback(async (email: string) => {
    await neon(() => emailOtp().sendVerificationOtp({ email, type: "email-verification" }), "Couldn't send a new code.");
  }, []);

  const claim = useCallback(async (input: ClaimPageInput) => {
    const user = await api.claim(input);
    setMe((prev) => (prev ? { ...prev, user } : prev));
    return user;
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut().catch(() => undefined);
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({ identity: me?.identity ?? null, user: me?.user ?? null, checking, signIn, signUp, verifyEmail, resendCode, claim, logout }),
    [me, checking, signIn, signUp, verifyEmail, resendCode, claim, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}

/** Sends signed-out visitors to /login, and people without a page yet to claim one. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { identity, user, checking } = useAuth();
  const location = useLocation();
  if (checking) return <p className="loading-note">Loading your dashboard…</p>;
  if (!identity) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!user) return <Navigate to="/signup" replace />;
  return <>{children}</>;
}
