/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "admin" | "intern";

export interface AuthUser {
  id: number;
  fullname: string;
  username: string;
  role: Role;
  required_hours: number;
  must_change_password: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  setUser: (u: AuthUser) => void;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem("ojt_token");
      const u = localStorage.getItem("ojt_user");
      if (t && u) {
        setToken(t);
        setUserState(JSON.parse(u));
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const login = (u: AuthUser, t: string) => {
    localStorage.setItem("ojt_token", t);
    localStorage.setItem("ojt_user", JSON.stringify(u));
    setToken(t);
    setUserState(u);
  };

  const logout = () => {
    localStorage.removeItem("ojt_token");
    localStorage.removeItem("ojt_user");
    setToken(null);
    setUserState(null);
  };

  const setUser = (u: AuthUser) => {
    localStorage.setItem("ojt_user", JSON.stringify(u));
    setUserState(u);
  };

  return (
    <AuthCtx.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
