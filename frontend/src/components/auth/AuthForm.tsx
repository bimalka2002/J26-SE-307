"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";
import { GoogleButton } from "./GoogleButton";
import { returnPath } from "@/lib/auth";

function BrandMark() {
  return (
    <span className="brand-symbol" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="9" cy="12" r="4" />
        <circle cx="15" cy="12" r="4" />
      </svg>
    </span>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const auth = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = returnPath(params.get("next"));
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (auth.status === "authenticated") router.replace(next);
  }, [auth.status, next, router]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function submit(method: "login" | "register" | "google", body: object) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await auth.authenticate(method, body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const name = String(data.get("name") || "").trim();
    if (register && !name) {
      setError("Please enter your name.");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError("Password must be at most 72 UTF-8 bytes. Try fewer characters.");
      return;
    }
    if (register && password !== data.get("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }
    void submit(mode, { email, password, ...(register ? { name } : {}) });
  }

  if (auth.status === "loading" || auth.status === "authenticated") {
    return (
      <p className="auth-status" role="status">
        Checking your session…
      </p>
    );
  }

  if (auth.status === "error") {
    return (
      <div className="auth-status">
        <p role="alert">{auth.error}</p>
        <button className="primary-button" onClick={auth.retry}>
          Try again
        </button>
        <button className="text-button" onClick={auth.logout}>
          Return to sign in
        </button>
      </div>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-intro" aria-label="OralScan">
        <Link href="/" className="brand">
          <BrandMark />
          OralScan
        </Link>
        <div className="intro-copy">
          <p className="eyebrow">AI oral disease screening</p>
          <h1>
            Detect
            <br />
            <span className="intro-outline">Oral Disease</span>
          </h1>
          <p>
            {register
              ? "Create an account to upload oral images and run AI screening for oral diseases."
              : "Sign in to continue screening oral images and reviewing condition findings."}
          </p>
        </div>
        <p className="intro-footer">
          <Link href="/">← Back to home</Link>
        </p>
      </section>

      <section className="auth-panel" aria-labelledby="form-title">
        <div className="auth-card">
          <p className="eyebrow">{register ? "Get started" : "Welcome back"}</p>
          <h2 id="form-title">{register ? "Create your account" : "Sign in to OralScan"}</h2>
          <p className="form-subtitle">
            {register
              ? "Enter your details to join OralScan."
              : "Enter your email and password to continue."}
          </p>
          {error ? (
            <div className="api-error" role="alert" tabIndex={-1} ref={errorRef}>
              {error}
            </div>
          ) : null}
          <form onSubmit={handleSubmit} aria-busy={busy}>
            <fieldset disabled={busy}>
              {register ? (
                <label>
                  Full name
                  <input name="name" autoComplete="name" required maxLength={100} placeholder="Your full name" />
                </label>
              ) : null}
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete={register ? "new-password" : "current-password"}
                  required
                  minLength={register ? 8 : undefined}
                  aria-describedby={register ? "password-hint" : undefined}
                />
                {register ? (
                  <span id="password-hint" className="field-hint">
                    At least 8 characters; at most 72 bytes.
                  </span>
                ) : null}
              </label>
              {register ? (
                <label>
                  Confirm password
                  <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
                </label>
              ) : null}
              <button className="primary-button" type="submit">
                {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
              </button>
            </fieldset>
          </form>
          <div className="divider">
            <span>or continue with</span>
          </div>
          <GoogleButton disabled={busy} onCredential={(credential) => void submit("google", { credential })} />
          <p className="switch-auth">
            {register ? "Already have an account?" : "New to OralScan?"}{" "}
            <Link href={`${register ? "/login" : "/register"}?next=${encodeURIComponent(next)}`}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <p className="sr-only" role="status">
            {busy ? "Signing you in. Please wait." : ""}
          </p>
        </div>
      </section>
    </main>
  );
}
