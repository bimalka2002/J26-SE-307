import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { SessionStatus } from "@/components/auth/SessionStatus";
export default function LoginPage() {
  return <Suspense fallback={<SessionStatus>Loading sign in…</SessionStatus>}><AuthForm mode="login" /></Suspense>;
}
