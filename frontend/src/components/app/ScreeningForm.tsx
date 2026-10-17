"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { ApiError } from "@/lib/auth";
import { createAnalysis } from "@/lib/analysis";

const SYMPTOM_OPTIONS = [
  "White patches",
  "Red patches",
  "Burning sensation",
  "Difficulty opening mouth",
  "Tooth pain",
  "Bleeding gums",
];

export function ScreeningForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [oralName, setOralName] = useState("");
  const [xrayName, setXrayName] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const oralRef = useRef<HTMLInputElement>(null);
  const xrayRef = useRef<HTMLInputElement>(null);
  const pending = useRef(false);

  function toggleSymptom(value: string) {
    setSymptoms((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;

    const form = event.currentTarget;
    const oral = oralRef.current?.files?.[0];
    const xray = xrayRef.current?.files?.[0];
    if (!oral && !xray) {
      setError("Upload an oral photo or a dental X-ray to continue.");
      return;
    }

    const ageRaw = String(new FormData(form).get("age") || "").trim();
    const gender = String(new FormData(form).get("gender") || "").trim();
    const smoking = String(new FormData(form).get("smokingHistory") || "");
    const notes = String(new FormData(form).get("notes") || "").trim();

    const clinicalData: Record<string, unknown> = {};
    if (ageRaw) {
      const age = Number(ageRaw);
      if (!Number.isFinite(age) || age < 1 || age > 120) {
        setError("Enter a valid age between 1 and 120.");
        return;
      }
      clinicalData.age = age;
    }
    if (gender) clinicalData.gender = gender;
    if (smoking === "yes" || smoking === "no") clinicalData.smokingHistory = smoking === "yes";
    if (symptoms.length) clinicalData.symptoms = symptoms;
    if (notes) clinicalData.notes = notes;

    const body = new FormData();
    if (oral) body.append("oral_photo", oral);
    if (xray) body.append("xray", xray);
    body.append("clinicalData", JSON.stringify(clinicalData));

    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await createAnalysis(body);
      router.push(`/app/screening/${encodeURIComponent(result.analysisId)}`);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Unable to start analysis.");
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <section id="new-screening" className="app-panel app-panel-home">
      <div className="app-panel-head app-panel-head-home">
        <h2>New screening</h2>
        <p>
          Add an intraoral photo and, if available, a dental X-ray. Models screen for OLP, OSMF,
          leukoplakia/erythroplakia, and caries.
        </p>
      </div>

      <form className="app-form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className="api-error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="app-upload-grid">
          <label className={`app-upload${oralName ? " has-file" : ""}`}>
            <input
              ref={oralRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={(event) => setOralName(event.target.files?.[0]?.name || "")}
            />
            <span className="app-upload-kicker">Oral photo</span>
            <strong>{oralName || "Drop or browse JPEG / PNG"}</strong>
            <span className="app-upload-hint">Recommended for OLP, OSMF, and ELP models</span>
          </label>

          <label className={`app-upload${xrayName ? " has-file" : ""}`}>
            <input
              ref={xrayRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={(event) => setXrayName(event.target.files?.[0]?.name || "")}
            />
            <span className="app-upload-kicker">Dental X-ray</span>
            <strong>{xrayName || "Optional JPEG / PNG"}</strong>
            <span className="app-upload-hint">Used primarily for caries screening</span>
          </label>
        </div>

        <div className="app-field-grid">
          <label>
            Age
            <input name="age" type="number" min={1} max={120} placeholder="e.g. 45" inputMode="numeric" />
          </label>
          <label>
            Gender
            <select name="gender" defaultValue="">
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Smoking history
            <select name="smokingHistory" defaultValue="">
              <option value="">Not specified</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
        </div>

        <fieldset className="app-symptoms">
          <legend>Symptoms</legend>
          <div className="app-symptom-list">
            {SYMPTOM_OPTIONS.map((item) => {
              const active = symptoms.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  className={`app-symptom${active ? " is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => toggleSymptom(item)}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="app-notes">
          Additional notes
          <textarea name="notes" rows={3} placeholder="Anything a clinician should know…" maxLength={500} />
        </label>

        <div className="app-form-footer">
          <p className="app-disclaimer">
            Screening support only — not a clinical diagnosis. Follow up with a qualified clinician.
          </p>
          <AnimatedButton type="submit" arrow disabled={busy}>
            {busy ? "Starting…" : "Run screening"}
          </AnimatedButton>
        </div>
      </form>
    </section>
  );
}
