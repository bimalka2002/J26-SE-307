"use client";

import { use } from "react";
import { AuthGate } from "@/components/app/AuthGate";
import { ScreeningLoader } from "@/components/app/ScreeningLoader";

export default function ScreeningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGate>
      <ScreeningLoader analysisId={id} />
    </AuthGate>
  );
}
