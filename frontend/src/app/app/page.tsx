"use client";

import { motion, useReducedMotion } from "motion/react";
import { AuthGate } from "@/components/app/AuthGate";
import { ScreeningForm } from "@/components/app/ScreeningForm";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AppPage() {
  const auth = useAuth();
  const reduceMotion = useReducedMotion();
  const firstName =
    auth.user?.name.trim().split(/\s+/)[0] || auth.user?.name || "there";

  return (
    <AuthGate>
      <main className="app-main app-main-home">
        <motion.div
          className="app-home"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <header className="app-home-intro">
            <p className="app-eyebrow">Workspace</p>
            <h1>
              Welcome back, <span className="app-welcome-name">{firstName}</span>
            </h1>
            <p>
              Upload an oral photo and optional X-ray to start screening. You’ll see a progress
              screen, then results on a separate page.
            </p>
          </header>
          <ScreeningForm />
        </motion.div>
      </main>
    </AuthGate>
  );
}
