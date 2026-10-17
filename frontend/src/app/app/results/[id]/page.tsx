"use client";

import { use } from "react";
import { AuthGate } from "@/components/app/AuthGate";
import { ResultsView } from "@/components/app/ResultsView";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGate>
      <ResultsView analysisId={id} />
    </AuthGate>
  );
}
