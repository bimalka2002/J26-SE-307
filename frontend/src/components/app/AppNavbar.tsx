"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import type { User } from "@/lib/auth";

const roleLabel: Record<User["role"], string> = {
  general: "General",
  clinical: "Clinical",
  admin: "Admin",
};

export function AppNavbar({ user }: { user: User }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const onWorkspace = pathname === "/app";

  function logout() {
    auth.logout();
    router.replace("/login");
  }

  return (
    <header className="app-nav">
      <div className="app-nav-inner">
        <Link href="/app" className="dv-logo">
          OralScan
        </Link>

        <nav className="app-nav-links" aria-label="App">
          <Link href="/app" className={onWorkspace ? "is-active" : undefined}>
            New screening
          </Link>
        </nav>

        <div className="app-nav-actions">
          <div className="app-user-chip">
            <span className="app-user-name">{user.name}</span>
            <span className="app-user-role">{roleLabel[user.role]}</span>
          </div>
          <AnimatedButton type="button" onClick={logout} className="app-logout-btn">
            Log out
          </AnimatedButton>
        </div>
      </div>
    </header>
  );
}
