import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { LoginInput, UserDTO } from "@event-tree/api-client";
import { api, session } from "../lib/api";

interface AuthState {
  user: UserDTO | null;
  login: (input: LoginInput) => Promise<UserDTO>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** The logged-in host, shared by the dashboard screens. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);

  const login = useCallback(async (input: LoginInput) => {
    const result = await api.login(input);
    session.set(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    session.set(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}
