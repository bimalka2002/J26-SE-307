"use client";

import { useEffect } from "react";

const faqs = [
  {
    id: "faq-diagnosis",
    q: "Is this a diagnosis?",
    a: "No. OralScan is screening support. It points out visual signs that may be worth checking. Only a qualified clinician can diagnose a condition, so please share your results with one.",
  },
  {
    q: "What images can I upload?",
    a: "JPEG or PNG files. You can add an intraoral photo, a dental X-ray, or both. At least one image is needed to run a screening.",
  },
  {
    q: "Do I need both a photo and an X-ray?",
    a: "No. Photos are used for OLP, OSMF, and leukoplakia/erythroplakia. X-rays are used mainly for caries. If you upload only one, the models that need the other image are skipped.",
  },
  {
    id: "faq-data",
    q: "What happens to my images and results?",
    a: "Your uploads and results are linked to your account, and you need to sign in to view them. Please do not upload images of other people without their consent.",
  },
  {
    q: "Who is behind OralScan?",
    a: "OralScan is a research project at SLIIT. The models are still being developed, which is why results should be treated as early signals, not answers.",
  },
  {
    q: "What should I do after I get a result?",
    a: "If any condition is flagged, or you have symptoms such as patches, pain, or difficulty opening your mouth, book a visit with a dentist or doctor. A clear result does not replace a regular check-up.",
  },
];

export function Faq() {
  // Footer links point at individual questions, so open the one in the URL hash.
  useEffect(() => {
    function openFromHash() {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target instanceof HTMLDetailsElement) target.open = true;
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  return (
    <section id="faq" className="dv-faq">
      <div className="dv-faq-inner">
        <div className="dv-faq-head">
          <p className="dv-section-eyebrow">FAQ</p>
          <h2>Questions you might have</h2>
          <p>
            Short answers about what OralScan can and cannot do, and how your images are handled.
          </p>
        </div>

        <div className="dv-faq-list">
          {faqs.map((item) => (
            <details key={item.q} id={item.id} className="dv-faq-item">
              <summary>
                <span>{item.q}</span>
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden>
                  <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
