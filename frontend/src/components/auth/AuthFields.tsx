"use client";

import { useState, type ComponentProps, type ReactNode } from "react";

// Mirrors the backend rules in authController.js: 8+ characters, at most 72 UTF-8 bytes.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX_BYTES = 72;
export const passwordBytes = (value: string) => new TextEncoder().encode(value).length;

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
};

export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint}
      {error ? (
        <p id={`${id}-error`} className="field-error">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.8v3.6M8 10.9h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<ComponentProps<"input">, "id" | "name"> & {
  name: string;
  label: string;
  error?: string;
};

export function TextField({ name, label, error, ...input }: TextFieldProps) {
  return (
    <Field id={name} label={label} error={error}>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...input}
      />
    </Field>
  );
}

type PasswordFieldProps = Omit<ComponentProps<"input">, "id" | "name" | "type" | "value" | "onChange"> & {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rules?: boolean;
};

function RuleItem({ state, children }: { state: "idle" | "met" | "unmet"; children: ReactNode }) {
  const status = state === "met" ? "Met" : "Not met yet";
  return (
    <li className={`pw-rule is-${state}`}>
      <span className="pw-rule-icon" aria-hidden>
        {state === "met" ? (
          <svg viewBox="0 0 16 16" width="10" height="10" fill="none">
            <path d="M3.5 8.2 6.4 11l6.1-6.4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      {children}
      <span className="sr-only"> — {status}</span>
    </li>
  );
}

export function PasswordField({ name, label, value, onChange, error, rules, ...input }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const typed = value.length > 0;
  const rulesId = `${name}-rules`;
  const describedBy = [error ? `${name}-error` : null, rules ? rulesId : null].filter(Boolean).join(" ");

  return (
    <Field
      id={name}
      label={label}
      error={error}
      hint={
        rules ? (
          <ul id={rulesId} className="pw-rules" aria-label="Password requirements">
            <RuleItem state={!typed ? "idle" : value.length >= PASSWORD_MIN ? "met" : "unmet"}>
              At least {PASSWORD_MIN} characters
            </RuleItem>
          </ul>
        ) : null
      }
    >
      <div className="password-wrap">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          autoCapitalize="none"
          spellCheck={false}
          {...input}
        />
        <button
          type="button"
          className="password-toggle"
          aria-pressed={visible}
          aria-controls={name}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Hide" : "Show"}
          <span className="sr-only"> {label.toLowerCase()}</span>
        </button>
      </div>
    </Field>
  );
}
