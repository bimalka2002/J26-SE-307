"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "anonymous") {
      const next = window.location.pathname + window.location.search + window.location.hash;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [auth.status, router]);

  return auth;
}
