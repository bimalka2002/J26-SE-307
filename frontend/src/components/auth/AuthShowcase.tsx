"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const PHASES = [
  { label: "Scanning", ms: 2200 },
  { label: "Analysing", ms: 1800 },
  { label: "Results ready", ms: 3800 },
] as const;
const READY = PHASES.length - 1;

const rows = [
  { name: "OLP", fill: 0.16, flag: false },
  { name: "OSMF", fill: 0.1, flag: false },
  { name: "ELP", fill: 0.66, flag: true },
  { name: "Caries", fill: 0.24, flag: false },
] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

// Decorative loop: an image is scanned, analysed, then per-condition results fill in.
export function AuthShowcase() {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setTimeout(() => setPhase((p) => (p + 1) % PHASES.length), PHASES[phase].ms);
    return () => window.clearTimeout(id);
  }, [phase, reduceMotion]);

  const current = reduceMotion ? READY : phase;
  const ready = current === READY;

  return (
    <div className="auth-showcase" aria-hidden>
      <div className={`auth-scan${ready ? " is-ready" : ""}`}>
        <span className="auth-scan-corner is-tl" />
        <span className="auth-scan-corner is-tr" />
        <span className="auth-scan-corner is-bl" />
        <span className="auth-scan-corner is-br" />
        <div className="auth-scan-grid" />
        <svg className="auth-scan-tooth" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
          <path d="M7 4.5c-2.6 0-4.2 2.1-4.2 4.6 0 2.1.9 3.5 1.5 5.4.6 1.9.7 5.5 2 5.5 1.5 0 1.2-3.6 2.5-4.6.7-.6 1.5-.6 2.2 0 1.3 1 1 4.6 2.5 4.6 1.3 0 1.4-3.6 2-5.5.6-1.9 1.5-3.3 1.5-5.4 0-2.5-1.6-4.6-4.2-4.6-1.8 0-2.6.9-5.1.9S8.8 4.5 7 4.5z" />
        </svg>
        {!reduceMotion ? (
          <motion.div
            className="auth-scan-beam"
            animate={{ top: ["10%", "86%", "10%"], opacity: ready ? 0 : [0.4, 1, 0.4] }}
            transition={{
              top: { duration: 2.4, ease: "easeInOut", repeat: Infinity },
              opacity: ready ? { duration: 0.4 } : { duration: 2.4, ease: "easeInOut", repeat: Infinity },
            }}
          />
        ) : null}
      </div>

      <div className="auth-results">
        <p className="auth-results-status">
          <span className={`auth-results-dot${ready ? " is-ready" : ""}`} />
          {PHASES[current].label}
          {ready ? null : "…"}
        </p>
        <ul>
          {rows.map((row, index) => (
            <li key={row.name} className={row.flag ? "is-flag" : undefined}>
              <span>{row.name}</span>
              <div className="auth-results-bar">
                <motion.span
                  style={{ transformOrigin: "left center" }}
                  initial={false}
                  animate={{ scaleX: ready ? row.fill : 0 }}
                  transition={
                    ready
                      ? { duration: 0.8, delay: 0.15 + index * 0.12, ease: easeOut }
                      : { duration: 0.3 }
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
