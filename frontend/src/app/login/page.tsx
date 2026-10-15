import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
export default function LoginPage() {
  return <Suspense fallback={<p className="auth-status" role="status">Loading sign in…</p>}><AuthForm mode="login" /></Suspense>;
}
