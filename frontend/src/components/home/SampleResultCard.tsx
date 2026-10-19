"use client";

import { motion, useReducedMotion } from "motion/react";

const sampleRows = [
  { name: "Oral lichen planus (OLP)", level: "low", label: "Low signal", fill: 0.14 },
  { name: "Oral submucous fibrosis (OSMF)", level: "low", label: "Low signal", fill: 0.09 },
  { name: "Leukoplakia / erythroplakia", level: "flag", label: "Follow-up advised", fill: 0.68 },
  { name: "Dental caries", level: "low", label: "Low signal", fill: 0.22 },
] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

export function SampleResultCard() {
  const reduceMotion = useReducedMotion();

  return (
    <article className="dv-sample" aria-label="Example of an OralScan result">
      <header className="dv-sample-head">
        <div>
          <p className="dv-sample-kicker">Example result</p>
          <h2>Screening summary</h2>
        </div>
        <span className="dv-sample-tag">Illustrative</span>
      </header>

      <p className="dv-sample-inputs">
        <span>Oral photo</span>
        <span>Dental X-ray</span>
      </p>

      <ul className="dv-sample-rows">
        {sampleRows.map((row, index) => (
          <li key={row.name} className={`dv-sample-row is-${row.level}`}>
            <div className="dv-sample-row-top">
              <span>{row.name}</span>
              <strong>{row.label}</strong>
            </div>
            <div className="dv-sample-bar" aria-hidden>
              <motion.span
                style={{ transformOrigin: "left center" }}
                initial={reduceMotion ? { scaleX: row.fill } : { scaleX: 0 }}
                animate={{ scaleX: row.fill }}
                transition={{ duration: 0.9, delay: 0.6 + index * 0.12, ease: easeOut }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="dv-sample-foot">
        Bring results like this to a clinician. Sample data, not a real person.
      </p>
    </article>
  );
}
