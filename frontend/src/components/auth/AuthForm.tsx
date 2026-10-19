"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";
import { PASSWORD_MAX_BYTES, PASSWORD_MIN, PasswordField, TextField, passwordBytes } from "./AuthFields";
import { AuthShowcase } from "./AuthShowcase";
import { GoogleButton } from "./GoogleButton";
import { SessionStatus } from "./SessionStatus";
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

type FieldName = "name" | "email" | "password" | "confirmPassword";
type Values = Record<FieldName, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOO_LONG = `That password is too long. Use ${PASSWORD_MAX_BYTES} characters or fewer (accented and non-English letters can count as more than one).`;

function validate(values: Values, register: boolean): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};
  const name = values.name.trim();
  const email = values.email.trim();

  if (register) {
    if (!name) errors.name = "Enter your full name.";
    else if (name.length > 100) errors.name = "Your name must be 100 characters or fewer.";
  }

  if (!email) errors.email = "Enter your email address.";
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = "Enter a valid email address, like you@example.com.";

  if (!values.password) errors.password = register ? "Create a password." : "Enter your password.";
  else if (register && values.password.length < PASSWORD_MIN) errors.password = `Use at least ${PASSWORD_MIN} characters.`;
  else if (passwordBytes(values.password) > PASSWORD_MAX_BYTES) errors.password = TOO_LONG;

  if (register) {
    if (!values.confirmPassword) errors.confirmPassword = "Re-enter your password to confirm it.";
    else if (values.confirmPassword !== values.password) errors.confirmPassword = "The passwords don't match.";
  }

  return errors;
}

const FIELD_ORDER: FieldName[] = ["name", "email", "password", "confirmPassword"];

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
  const [values, setValues] = useState<Values>({ name: "", email: "", password: "", confirmPassword: "" });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const errors = validate(values, register);
  const shown = (field: FieldName) => (touched[field] || submitted ? errors[field] : undefined);

  function update(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setError("");
  }

  const blur = (field: FieldName) => () => setTouched((current) => ({ ...current, [field]: true }));
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
    setSubmitted(true);
    const firstInvalid = FIELD_ORDER.find((field) => errors[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    const email = values.email.trim();
    const name = values.name.trim();
    void submit(mode, { email, password: values.password, ...(register ? { name } : {}) });
  }

  if (auth.status === "loading" || auth.status === "authenticated") {
    return <SessionStatus>Checking your session…</SessionStatus>;
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
        <AuthShowcase />
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
          <form onSubmit={handleSubmit} aria-busy={busy} noValidate>
            <fieldset disabled={busy}>
              {register ? (
                <TextField
                  name="name"
                  label="Full name"
                  autoComplete="name"
                  maxLength={100}
                  placeholder="Your full name"
                  value={values.name}
                  onChange={(event) => update("name", event.target.value)}
                  onBlur={blur("name")}
                  error={shown("name")}
                />
              ) : null}
              <TextField
                name="email"
                label="Email address"
                type="email"
                autoComplete="email"
                maxLength={254}
                placeholder="you@example.com"
                autoCapitalize="none"
                spellCheck={false}
                value={values.email}
                onChange={(event) => update("email", event.target.value)}
                onBlur={blur("email")}
                error={shown("email")}
              />
              <PasswordField
                name="password"
                label="Password"
                autoComplete={register ? "new-password" : "current-password"}
                value={values.password}
                onChange={(value) => update("password", value)}
                onBlur={blur("password")}
                error={shown("password")}
                rules={register}
              />
              {register ? (
                <PasswordField
                  name="confirmPassword"
                  label="Confirm password"
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={(value) => update("confirmPassword", value)}
                  onBlur={blur("confirmPassword")}
                  error={shown("confirmPassword")}
                />
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
