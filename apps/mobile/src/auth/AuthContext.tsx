import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, EMAIL_NOT_VERIFIED, friendlyAuthMessage, type ClaimPageInput, type MeDTO, type UserDTO } from "@event-tree/api-client";
import { api, auth } from "../lib/api";

interface AuthState {
  /** Signed in with Neon Auth. */
  identity: MeDTO["identity"] | null;
  /** Their page; null until they claim a username. */
  user: UserDTO | null;
  /** True while the saved session is checked on launch. */
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

/** The signed-in host, shared by the dashboard screens. Restores the saved session on launch. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeDTO | null>(null);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    if (!(await auth.token())) {
      setMe(null);
      return null;
    }
    const next = await api.me();
    setMe(next);
    return next;
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
      await auth.signIn(input);
      return afterSignIn();
    },
    [afterSignIn],
  );

  const signUp = useCallback(
    async (input: { email: string; password: string; name: string }) => {
      const { verified } = await auth.signUp(input);
      // No session yet: the account exists, but the emailed code must be entered first.
      if (!verified) throw new ApiError(403, EMAIL_NOT_VERIFIED, friendlyAuthMessage(EMAIL_NOT_VERIFIED, ""));
      return afterSignIn();
    },
    [afterSignIn],
  );

  const verifyEmail = useCallback(
    async (input: { email: string; otp: string }) => {
      await auth.verifyEmail(input);
      return afterSignIn();
    },
    [afterSignIn],
  );

  const resendCode = useCallback((email: string) => auth.sendVerificationCode(email), []);

  const claim = useCallback(async (input: ClaimPageInput) => {
    const user = await api.claim(input);
    setMe((prev) => (prev ? { ...prev, user } : prev));
    return user;
  }, []);

  const logout = useCallback(async () => {
    await auth.signOut().catch(() => undefined);
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
