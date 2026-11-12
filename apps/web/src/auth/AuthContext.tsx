import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ApiError, type LoginInput, type SignupInput, type UserDTO } from "@event-tree/api-client";
import { api, tokenStore } from "../lib/api";

interface AuthState {
  user: UserDTO | null;
  /** True until the stored token has been checked on first load. */
  checking: boolean;
  login: (input: LoginInput) => Promise<UserDTO>;
  signup: (input: SignupInput) => Promise<UserDTO>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** Holds the logged-in host. Validates a stored token once on load and drops it if it has expired. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [checking, setChecking] = useState(() => !!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .me()
      .then(setUser)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) tokenStore.clear();
      })
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const session = await api.login(input);
    tokenStore.set(session.token);
    setUser(session.user);
    return session.user;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const session = await api.signup(input);
    tokenStore.set(session.token);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, checking, login, signup, logout }), [user, checking, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}

/** Sends logged-out visitors to /login and brings them back afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking) return <p className="loading-note">Loading your dashboard…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
