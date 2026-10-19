import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { SessionStatus } from "@/components/auth/SessionStatus";
export default function RegisterPage() {
  return <Suspense fallback={<SessionStatus>Loading registration…</SessionStatus>}><AuthForm mode="register" /></Suspense>;
}
