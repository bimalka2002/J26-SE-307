"use client";

import type { ReactNode } from "react";
import { useRequireAuth } from "@/components/app/useRequireAuth";
import { AppNavbar } from "@/components/app/AppNavbar";
import { SessionStatus } from "@/components/auth/SessionStatus";

export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useRequireAuth();

  if (auth.status === "error") {
    return (
      <main className="auth-status">
        <p role="alert">{auth.error}</p>
        <button className="primary-button" onClick={auth.retry}>
          Try again
        </button>
        <button className="text-button" onClick={auth.logout}>
          Sign out
        </button>
      </main>
    );
  }

  if (auth.status !== "authenticated" || !auth.user) {
    return <SessionStatus>Checking your session…</SessionStatus>;
  }

  return (
    <div className="dv-page app-page">
      <AppNavbar user={auth.user} />
      {children}
    </div>
  );
}
