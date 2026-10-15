import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
export default function RegisterPage() {
  return <Suspense fallback={<p className="auth-status" role="status">Loading registration…</p>}><AuthForm mode="register" /></Suspense>;
}
