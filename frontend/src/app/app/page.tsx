"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AppPage() {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.status === "anonymous") {
      const next = window.location.pathname + window.location.search + window.location.hash;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [auth.status, router]);
  if (auth.status === "error") return <main className="auth-status"><p role="alert">{auth.error}</p><button className="primary-button" onClick={auth.retry}>Try again</button><button className="text-button" onClick={auth.logout}>Sign out</button></main>;
  if (auth.status !== "authenticated" || !auth.user) return <p className="auth-status" role="status">Checking your session…</p>;
  return <main className="signed-in"><p className="brand">OralScan</p><h1>You’re signed in, {auth.user.name}.</h1><button className="primary-button" onClick={() => { auth.logout(); router.replace("/login"); }}>Log out</button></main>;
}
