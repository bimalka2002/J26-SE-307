"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { ImageSlot, formatSize, type PickedImage } from "@/components/app/ImageSlot";
import { PhotoTips } from "@/components/app/PhotoTips";
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

const NOTES_MAX = 500;

type Slot = "oral" | "xray";

export function ScreeningForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<Record<Slot, PickedImage | null>>({ oral: null, xray: null });
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [smoking, setSmoking] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const pending = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const urls = useRef<string[]>([]);

  const hasImage = Boolean(images.oral || images.xray);
  const ageNumber = Number(age);
  const ageError =
    age.trim() !== "" && (!Number.isFinite(ageNumber) || ageNumber < 1 || ageNumber > 120)
      ? "Enter an age between 1 and 120, or leave it blank."
      : "";

  // Move focus to the step heading when the step changes, but not on first load.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  // Free the preview blobs when the form goes away.
  useEffect(() => {
    const created = urls.current;
    return () => created.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function pick(slot: Slot, file: File) {
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    setImages((current) => {
      if (current[slot]) URL.revokeObjectURL(current[slot].url);
      return { ...current, [slot]: { file, url } };
    });
    setError("");
  }

  function remove(slot: Slot) {
    setImages((current) => {
      if (current[slot]) URL.revokeObjectURL(current[slot].url);
      return { ...current, [slot]: null };
    });
  }

  function toggleSymptom(value: string) {
    setSymptoms((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  async function run() {
    if (pending.current || !hasImage) return;
    if (ageError) {
      setStep(2);
      setError(ageError);
      return;
    }

    const clinicalData: Record<string, unknown> = {};
    if (age.trim()) clinicalData.age = ageNumber;
    if (gender) clinicalData.gender = gender;
    if (smoking === "yes" || smoking === "no") clinicalData.smokingHistory = smoking === "yes";
    if (symptoms.length) clinicalData.symptoms = symptoms;
    if (notes.trim()) clinicalData.notes = notes.trim();

    const body = new FormData();
    if (images.oral) body.append("oral_photo", images.oral.file);
    if (images.xray) body.append("xray", images.xray.file);
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1) {
      if (hasImage) setStep(2);
      return;
    }
    void run();
  }

  const stepTitle = step === 1 ? "Add your images" : "Add some details";

  return (
    <section id="new-screening" className="app-panel app-panel-home">
      <div className="app-panel-head app-panel-head-home">
        <h2>New screening</h2>
        <p>
          Models screen for OLP, OSMF, leukoplakia/erythroplakia, and caries. You need at least one
          image to start.
        </p>
      </div>

      <ol className="app-steps" aria-label="Progress">
        <li className={step === 1 ? "is-current" : "is-done"} aria-current={step === 1 ? "step" : undefined}>
          <span className="app-step-num">{step === 1 ? "1" : "✓"}</span>
          Images
        </li>
        <li className={step === 2 ? "is-current" : undefined} aria-current={step === 2 ? "step" : undefined}>
          <span className="app-step-num">2</span>
          Details <em>Optional</em>
        </li>
      </ol>

      <form className="app-form" onSubmit={handleSubmit} noValidate>
        <h3 className="app-step-title" ref={headingRef} tabIndex={-1}>
          {stepTitle}
        </h3>

        {error ? (
          <div className="api-error" role="alert">
            {error}
          </div>
        ) : null}

        <div hidden={step !== 1} className="app-step-body">
          <div className="app-slots">
            <ImageSlot
              id="oral-photo"
              kicker="Oral photo"
              title="Oral photo"
              hint="JPEG or PNG, up to 10 MB. Best for OLP, OSMF, ELP and caries."
              picked={images.oral}
              onPick={(file) => pick("oral", file)}
              onRemove={() => remove("oral")}
            />
            <ImageSlot
              id="dental-xray"
              kicker="Dental X-ray · optional"
              title="Dental X-ray"
              hint="JPEG or PNG, up to 10 MB. Used for caries screening."
              picked={images.xray}
              onPick={(file) => pick("xray", file)}
              onRemove={() => remove("xray")}
            />
          </div>

          <PhotoTips />

          <div className="app-form-footer">
            <p className="app-disclaimer" aria-live="polite">
              {hasImage
                ? "Looking good. Next you can add optional details, or skip them."
                : "Add at least one image to continue."}
            </p>
            <div className="app-form-actions">
              <button type="button" className="app-link-btn" disabled={!hasImage || busy} onClick={() => void run()}>
                {busy ? "Starting…" : "Skip details and run screening"}
              </button>
              <AnimatedButton type="submit" arrow disabled={!hasImage}>
                Continue
              </AnimatedButton>
            </div>
          </div>
        </div>

        <div hidden={step !== 2} className="app-step-body">
          <div className="app-summary-strip">
            {(["oral", "xray"] as const).map((slot) => {
              const picked = images[slot];
              return picked ? (
                <span key={slot} className="app-summary-item">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a local blob preview */}
                  <img src={picked.url} alt="" />
                  {slot === "oral" ? "Oral photo" : "Dental X-ray"} · {formatSize(picked.file.size)}
                </span>
              ) : null;
            })}
            <button type="button" className="app-link-btn" onClick={() => setStep(1)}>
              Change images
            </button>
          </div>

          <p className="app-why">
            Everything on this page is optional. These details are saved with your screening so you
            can share the context with a clinician. They don&apos;t change the automated image
            results.
          </p>

          <div className="app-field-grid">
            <label>
              Age
              <input
                name="age"
                type="number"
                min={1}
                max={120}
                placeholder="e.g. 45"
                inputMode="numeric"
                value={age}
                onChange={(event) => setAge(event.target.value)}
                aria-invalid={ageError ? true : undefined}
                aria-describedby={ageError ? "age-error" : undefined}
              />
              {ageError ? (
                <span id="age-error" className="app-slot-error" style={{ display: "block" }}>
                  {ageError}
                </span>
              ) : null}
            </label>
            <label>
              Gender
              <select name="gender" value={gender} onChange={(event) => setGender(event.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Smoking history
              <select name="smokingHistory" value={smoking} onChange={(event) => setSmoking(event.target.value)}>
                <option value="">Not specified</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
          </div>

          <fieldset className="app-symptoms">
            <legend>Symptoms you have noticed</legend>
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
            <textarea
              name="notes"
              rows={3}
              placeholder="Anything a clinician should know…"
              maxLength={NOTES_MAX}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              aria-describedby="notes-counter"
            />
            <span
              id="notes-counter"
              className={`app-counter${notes.length >= NOTES_MAX - 50 ? " is-near" : ""}`}
            >
              {notes.length} / {NOTES_MAX}
            </span>
          </label>

          <div className="app-form-footer">
            <p className="app-disclaimer">
              Screening support only — not a clinical diagnosis. Follow up with a qualified clinician.
            </p>
            <div className="app-form-actions">
              <button type="button" className="app-link-btn" onClick={() => setStep(1)} disabled={busy}>
                Back
              </button>
              <AnimatedButton type="submit" arrow disabled={busy || !hasImage}>
                {busy ? "Starting…" : "Run screening"}
              </AnimatedButton>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
