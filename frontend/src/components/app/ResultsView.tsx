"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/auth";
import {
  classLabel,
  getAnalysis,
  getAnalysisImage,
  isFlagged,
  isNegativeClass,
  isTerminal,
  MODEL_LABELS,
  conditionOf,
  sortResults,
  summarize,
  type Analysis,
  type AnalysisInput,
  type ModelResult,
} from "@/lib/analysis";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { SessionStatus } from "@/components/auth/SessionStatus";

const MODALITY_LABEL: Record<AnalysisInput["modality"], string> = {
  oral_photo: "oral photo",
  xray: "X-ray",
};

function toFraction(score: number) {
  const value = score > 1 ? score / 100 : score;
  return Math.min(1, Math.max(0, value));
}

function formatScore(score: number) {
  return `${(toFraction(score) * 100).toFixed(1)}%`;
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function conditionName(modelKey: string) {
  const key = conditionOf(modelKey);
  return MODEL_LABELS[key] ?? key.toUpperCase();
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

type Verdict = { tone: "flag" | "clear" | "muted"; label: string };

function verdictOf(result: ModelResult): Verdict {
  if (result.status === "skipped") return { tone: "muted", label: "Not screened" };
  if (result.status === "failed") return { tone: "muted", label: "Couldn't be checked" };
  return isFlagged(result)
    ? { tone: "flag", label: "Follow-up advised" }
    : { tone: "clear", label: "Low signal" };
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span className={`app-verdict is-${verdict.tone}`}>
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden>
        {verdict.tone === "flag" ? (
          <path d="M8 3v5.5M8 11.6h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ) : verdict.tone === "clear" ? (
          <path d="M3.5 8.2 6.4 11l6.1-6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
      {verdict.label}
    </span>
  );
}

function ScoreBars({ result }: { result: ModelResult }) {
  const scores = Object.entries(result.classScores ?? {}).sort((a, b) => Number(b[1]) - Number(a[1]));
  if (!scores.length) return null;

  return (
    <ul className="app-bars">
      {scores.map(([label, score]) => {
        const isPrediction = label === result.predictedClass;
        return (
          <li key={label} className={`${isNegativeClass(label) ? "is-negative" : "is-positive"}${isPrediction ? " is-top" : ""}`}>
            <span className="app-bar-label">
              {classLabel(label)}
              {isPrediction ? <em>Result</em> : null}
            </span>
            <div className="app-bar-track" aria-hidden>
              <span style={{ width: `${toFraction(Number(score)) * 100}%` }} />
            </div>
            <strong>{formatScore(Number(score))}</strong>
          </li>
        );
      })}
    </ul>
  );
}

function ResultCard({ result }: { result: ModelResult }) {
  const verdict = verdictOf(result);
  return (
    <li className={`app-result-card is-${verdict.tone}`}>
      <div className="app-result-top">
        <div>
          <h3>{conditionName(result.modelKey)}</h3>
          <p className="app-result-meta">
            {result.status === "skipped" ? "Needs your" : "From your"} {MODALITY_LABEL[result.inputModality]}
          </p>
        </div>
        <VerdictBadge verdict={verdict} />
      </div>

      {result.status === "completed" ? (
        <>
          <ScoreBars result={result} />
          {result.qualityWarning ? <p className="app-quality-warn">Note: {result.qualityWarning}</p> : null}
        </>
      ) : null}
      {result.status === "failed" ? (
        <p className="app-result-meta">This check didn&apos;t finish, so there is no result for it. Try screening again later.</p>
      ) : null}
      {result.status === "skipped" ? (
        <p className="app-result-meta">
          Add an {MODALITY_LABEL[result.inputModality]} in a new screening to include this check.
        </p>
      ) : null}
    </li>
  );
}

function ImagePreview({ analysisId, modality }: { analysisId: string; modality: AnalysisInput["modality"] }) {
  const [state, setState] = useState<{ status: "loading" | "ready" | "error"; url?: string }>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;
    getAnalysisImage(analysisId, modality)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setState({ status: "ready", url: objectUrl });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [analysisId, modality]);

  return (
    <figure className="app-image">
      <div className="app-image-frame">
        {state.status === "ready" ? (
          // eslint-disable-next-line @next/next/no-img-element -- a blob URL from an authenticated fetch
          <img src={state.url} alt={`Your uploaded ${MODALITY_LABEL[modality]}`} />
        ) : state.status === "loading" ? (
          <span className="auth-spinner" aria-label="Loading image" role="status" />
        ) : (
          <span className="app-image-missing">Preview unavailable</span>
        )}
      </div>
      <figcaption>{modality === "xray" ? "Dental X-ray" : "Oral photo"}</figcaption>
    </figure>
  );
}

function nextSteps(flagged: number, screened: number) {
  if (screened === 0) {
    return [
      "Try again with a clear, well-lit photo or a sharp X-ray.",
      "If it keeps failing, come back later and try once more.",
    ];
  }
  if (flagged > 0) {
    return [
      "Book a visit with a dentist or doctor soon and show them this report.",
      "Tell them about any symptoms you have noticed, such as patches, pain or bleeding.",
      "Don't wait if things get worse. A screening result is not a diagnosis.",
    ];
  }
  return [
    "Keep up your regular dental check-ups.",
    "See a clinician if you notice patches, pain or trouble opening your mouth. A clear result doesn't rule a condition out.",
    "If your image was blurry or dark, screen again with a clearer one.",
  ];
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
        <SessionStatus>Loading your results…</SessionStatus>
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

  const results = sortResults(analysis.modelResults ?? []);
  const summary = summarize(results);
  const screenedAny = summary.screened > 0;
  const tone = !screenedAny ? "muted" : summary.flagged > 0 ? "flag" : "clear";
  const when = formatDate(analysis.createdAt);
  const inputs = analysis.inputs ?? [];
  const steps = nextSteps(summary.flagged, summary.screened);

  const headline = !screenedAny
    ? "We couldn't complete this screening"
    : summary.flagged > 0
      ? `${summary.flagged} of ${plural(summary.screened, "condition")} flagged for follow-up`
      : "No conditions flagged";

  const subline = !screenedAny
    ? analysis.error?.message
      ? "Something went wrong while checking your images. Please try again."
      : "None of the checks could run on the images provided."
    : summary.flagged > 0
      ? "These signs are worth showing to a dentist or doctor. This is screening support, not a diagnosis."
      : `None of the ${plural(summary.screened, "condition")} checked showed clear signs. This is screening support, not a diagnosis.`;

  const technical = results.filter((r) => r.status === "failed" && r.error?.message);

  return (
    <main className="app-main app-results-main">
      <p className="app-print-only">OralScan screening report{when ? `, ${when}` : ""}</p>

      <section className={`app-results-hero is-${tone}`}>
        <p className="app-eyebrow">Results{when ? ` · ${when}` : ""}</p>
        <h1>{headline}</h1>
        <p>{subline}</p>
        {screenedAny ? (
          <ul className="app-summary-chips">
            <li>{plural(summary.screened, "condition")} screened</li>
            <li className={summary.flagged ? "is-flag" : "is-clear"}>{summary.flagged} flagged</li>
            {summary.notScreened ? <li>{summary.notScreened} not screened</li> : null}
            {summary.failed ? <li>{summary.failed} couldn&apos;t be checked</li> : null}
          </ul>
        ) : null}
      </section>

      <div className="app-results-layout">
        <div className="app-results-col">
          {error ? (
            <div className="api-error" role="alert">
              {error}
            </div>
          ) : null}

          {results.length ? (
            <ul className="app-result-list">
              {results.map((result) => (
                <ResultCard key={`${result.modelKey}-${result.inputModality}`} result={result} />
              ))}
            </ul>
          ) : (
            <p className="app-result-meta">No results were returned for this screening.</p>
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
        </div>

        <aside className="app-results-aside">
          {inputs.length ? (
            <section className="app-aside-card">
              <h2>Images you uploaded</h2>
              <div className="app-images">
                {inputs.map((input) => (
                  <ImagePreview key={input.modality} analysisId={analysisId} modality={input.modality} />
                ))}
              </div>
            </section>
          ) : null}

          <section className={`app-aside-card app-next is-${tone}`}>
            <h2>What to do next</h2>
            <ol>
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <div className="app-results-actions">
            <button type="button" className="dv-btn dv-btn-soft" onClick={() => window.print()}>
              Print or save as PDF
            </button>
            <AnimatedButton href="/app" arrow>
              New screening
            </AnimatedButton>
          </div>

          <details className="app-tech">
            <summary>Technical details</summary>
            <dl>
              <dt>Reference</dt>
              <dd>
                <code>{analysisId}</code>
              </dd>
              {results
                .filter((r) => r.modelVersion)
                .map((r) => (
                  <div key={`${r.modelKey}-${r.inputModality}`}>
                    <dt>{r.modelKey} model</dt>
                    <dd>{r.modelVersion}</dd>
                  </div>
                ))}
              {technical.map((r) => (
                <div key={`err-${r.modelKey}`}>
                  <dt>{r.modelKey} error</dt>
                  <dd>{r.error?.message}</dd>
                </div>
              ))}
            </dl>
          </details>
        </aside>
      </div>
    </main>
  );
}
