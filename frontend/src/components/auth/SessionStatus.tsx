import type { ReactNode } from "react";

export function SessionStatus({ children }: { children: ReactNode }) {
  return (
    <div className="auth-status" role="status">
      <span className="auth-spinner" aria-hidden />
      <p>{children}</p>
    </div>
  );
}
