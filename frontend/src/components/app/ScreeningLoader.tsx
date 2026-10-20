"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ApiError } from "@/lib/auth";
import { getAnalysis, isTerminal, type AnalysisStatus } from "@/lib/analysis";

const STEPS = ["Queued", "Scanning images", "Running models", "Preparing results"] as const;

function stepIndex(status: AnalysisStatus | null, tick: number) {
  if (!status || status === "queued") return 0;
  if (status === "running") return 1 + (tick % 2);
  return 3;
}

export function ScreeningLoader({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setTick((value) => value + 1), 1600);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function poll() {
      try {
        const analysis = await getAnalysis(analysisId);
        if (cancelled) return;
        setStatus(analysis.status);
        setError("");
        if (isTerminal(analysis.status)) {
          router.replace(`/app/results/${encodeURIComponent(analysisId)}`);
          return;
        }
        timer = window.setTimeout(poll, 2000);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError || err instanceof Error ? err.message : "Unable to check screening status.");
        if (err instanceof ApiError && err.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(`/app/screening/${analysisId}`)}`);
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          return;
        }
        timer = window.setTimeout(poll, 4000);
      }
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [analysisId, router]);

  const active = stepIndex(status, tick);

  return (
    <main className="app-main app-loader-main">
      <section className="app-loader" aria-live="polite" aria-busy="true">
        <div className="app-loader-visual" aria-hidden>
          <span className="app-loader-orbit app-loader-orbit-outer" />
          <span className="app-loader-orbit app-loader-orbit-inner" />
          <motion.span
            className="app-loader-beam"
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={reduceMotion ? undefined : { duration: 2.8, ease: "linear", repeat: Infinity }}
          />
          <span className="app-loader-core" />
        </div>

        <p className="app-eyebrow">Screening in progress</p>
        <h1>Analysing your images</h1>
        <p className="app-loader-copy">
          Specialist models are reviewing your uploaded images. You’ll be taken to your results
          when screening finishes.
        </p>

        <ol className="app-loader-steps">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={
                index < active ? "is-done" : index === active ? "is-active" : undefined
              }
            >
              <span className="app-loader-step-dot" />
              {label}
            </li>
          ))}
        </ol>

        {error ? (
          <div className="api-error" role="alert">
            {error}
          </div>
        ) : (
          <p className="app-loader-status" role="status">
            Status: {status ?? "connecting…"}
          </p>
        )}

        <button type="button" className="text-button" onClick={() => router.push("/app")}>
          Cancel and return home
        </button>
      </section>
    </main>
  );
}
