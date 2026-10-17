"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/auth";
import {
  getAnalysis,
  isTerminal,
  modelLabel,
  type Analysis,
  type AnalysisStatus,
} from "@/lib/analysis";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

const STATUS_COPY: Record<AnalysisStatus, string> = {
  queued: "Queued — waiting for the pipeline",
  running: "Running specialist models…",
  completed: "Screening complete",
  failed: "Screening failed",
  partial_fail: "Completed with some model failures",
};

function formatScore(score: number) {
  const percent = score > 1 ? score : score * 100;
  return `${percent.toFixed(1)}%`;
}

export function ResultsView({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const next = await getAnalysis(analysisId);
        if (cancelled) return;
        if (!isTerminal(next.status)) {
          router.replace(`/app/screening/${encodeURIComponent(analysisId)}`);
          return;
        }
        setAnalysis(next);
        setError("");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError || err instanceof Error ? err.message : "Unable to load analysis.");
        if (err instanceof ApiError && err.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(`/app/results/${analysisId}`)}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [analysisId, router]);

  if (loading && !analysis) {
    return (
      <main className="app-main">
        <p className="auth-status" role="status">
          Loading results…
        </p>
      </main>
    );
  }

  if (error && !analysis) {
    return (
      <main className="app-main">
        <section className="app-panel">
          <div className="api-error" role="alert">
            {error}
          </div>
          <div className="app-form-footer" style={{ marginTop: 18 }}>
            <AnimatedButton href="/app" arrow>
              Back to screening
            </AnimatedButton>
          </div>
        </section>
      </main>
    );
  }

  if (!analysis) return null;

  const results = analysis.modelResults ?? [];
  const status = analysis.status;

  return (
    <main className="app-main app-results-main">
      <section className="app-results-hero">
        <p className="app-eyebrow">Results</p>
        <h1>{STATUS_COPY[status]}</h1>
        <p>
          Structured findings from OralScan specialist models. Use these as screening support, then
          follow up with a qualified clinician.
        </p>
        <p className="app-analysis-id">
          Analysis <code>{analysisId}</code>
        </p>
      </section>

      <section className="app-panel app-results-panel">
        {error ? (
          <div className="api-error" role="alert">
            {error}
          </div>
        ) : null}

        {analysis.error?.message ? (
          <div className="api-error" role="alert">
            {analysis.error.message}
          </div>
        ) : null}

        {results.length ? (
          <ul className="app-result-list">
            {results.map((result) => (
              <li key={`${result.modelKey}-${result.inputModality}`} className="app-result-card">
                <div className="app-result-top">
                  <h3>{modelLabel(result.modelKey)}</h3>
                  <span className={`app-status-pill is-${result.status}`}>{result.status}</span>
                </div>
                <p className="app-result-meta">
                  Input: {result.inputModality === "oral_photo" ? "Oral photo" : "X-ray"}
                </p>
                {result.status === "completed" ? (
                  <>
                    <p className="app-result-prediction">
                      Prediction: <strong>{result.predictedClass || "—"}</strong>
                    </p>
                    {result.classScores ? (
                      <ul className="app-score-list">
                        {Object.entries(result.classScores)
                          .sort((a, b) => Number(b[1]) - Number(a[1]))
                          .map(([label, score]) => (
                            <li key={label}>
                              <span>{label}</span>
                              <strong>{formatScore(Number(score))}</strong>
                            </li>
                          ))}
                      </ul>
                    ) : null}
                    {result.qualityWarning ? (
                      <p className="app-quality-warn">{result.qualityWarning}</p>
                    ) : null}
                  </>
                ) : null}
                {result.status === "failed" && result.error?.message ? (
                  <p className="app-quality-warn">{result.error.message}</p>
                ) : null}
                {result.status === "skipped" ? (
                  <p className="app-result-meta">Skipped — required image modality was not uploaded.</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="app-result-meta">No model results were returned for this analysis.</p>
        )}

        {analysis.report?.text ? (
          <article className="app-report">
            <h3>Report</h3>
            <p>{analysis.report.text}</p>
          </article>
        ) : null}

        <p className="app-disclaimer">
          These findings are AI-assisted screening signals only and must not replace clinical judgment.
        </p>

        <div className="app-results-actions">
          <AnimatedButton href="/app" arrow>
            New screening
          </AnimatedButton>
          <Link href="/app" className="dv-btn dv-btn-ghost">
            Back to workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
