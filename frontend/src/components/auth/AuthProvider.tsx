"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ApiError, authRequest, TOKEN_KEY, type Session, type User } from "@/lib/auth";

type AuthState = { status: "loading" | "authenticated" | "anonymous" | "error"; user: User | null; error?: string };
type AuthContextValue = AuthState & { authenticate: (method: "login" | "register" | "google", body: object) => Promise<void>; logout: () => void; retry: () => void };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });
  const revision = useRef(0);
  const restore = useCallback(async () => {
    const current = ++revision.current;
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { setState({ status: "anonymous", user: null }); return; }
      setState({ status: "loading", user: null });
      const { user } = await authRequest<{ user: User }>("me", undefined, token);
      if (current === revision.current) setState({ status: "authenticated", user });
    } catch (error) {
      if (current !== revision.current) return;
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setState({ status: "anonymous", user: null });
      } else {
        setState({ status: "error", user: null, error: error instanceof Error ? error.message : "Unable to restore your session." });
      }
    }
  }, []);

  useEffect(() => {
    // Defer initialization so server and first client render show the same state.
    void Promise.resolve().then(restore);
    const sync = (event: StorageEvent) => { if (event.key === TOKEN_KEY || event.key === null) void restore(); };
    window.addEventListener("storage", sync);
    return () => { ++revision.current; window.removeEventListener("storage", sync); };
  }, [restore]);

  async function authenticate(method: "login" | "register" | "google", body: object) {
    const current = ++revision.current;
    const session = await authRequest<Session>(method, body);
    if (current !== revision.current) return;
    try { localStorage.setItem(TOKEN_KEY, session.token); }
    catch { throw new Error("Allow browser storage to stay signed in, then try again."); }
    setState({ status: "authenticated", user: session.user });
  }

  function logout() {
    ++revision.current;
    localStorage.removeItem(TOKEN_KEY);
    window.google?.accounts.id.disableAutoSelect();
    setState({ status: "anonymous", user: null });
  }

  return <AuthContext.Provider value={{ ...state, authenticate, logout, retry: () => void restore() }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
