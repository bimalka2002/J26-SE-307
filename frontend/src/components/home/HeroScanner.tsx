"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const PHASES = [
  { label: "Scanning image", ms: 2400 },
  { label: "Checking 4 conditions", ms: 2600 },
  { label: "Results ready", ms: 3600 },
] as const;
const READY = PHASES.length - 1;

const CONDITIONS = ["OLP", "OSMF", "ELP", "Caries"] as const;

// Decorative loop: an image is scanned, each condition is checked in turn, then results are ready.
// It deliberately shows no findings, so it cannot be mistaken for a real result.
export function HeroScanner() {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const [checking, setChecking] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setTimeout(() => setPhase((p) => (p + 1) % PHASES.length), PHASES[phase].ms);
    return () => window.clearTimeout(id);
  }, [phase, reduceMotion]);

  // Step through the condition chips while the "checking" phase is showing.
  useEffect(() => {
    if (reduceMotion || phase !== 1) return;
    const id = window.setInterval(() => setChecking((c) => Math.min(c + 1, CONDITIONS.length)), 600);
    return () => {
      window.clearInterval(id);
      setChecking(0);
    };
  }, [phase, reduceMotion]);

  const current = reduceMotion ? READY : phase;
  const ready = current === READY;

  return (
    <div className="dv-scanner" aria-hidden>
      <div className="dv-scanner-frame">
        <span className="dv-scanner-corner is-tl" />
        <span className="dv-scanner-corner is-tr" />
        <span className="dv-scanner-corner is-bl" />
        <span className="dv-scanner-corner is-br" />
        <div className="dv-scanner-grid" />
        <svg
          className={`dv-scanner-tooth${ready ? " is-ready" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="M7 4.5c-2.6 0-4.2 2.1-4.2 4.6 0 2.1.9 3.5 1.5 5.4.6 1.9.7 5.5 2 5.5 1.5 0 1.2-3.6 2.5-4.6.7-.6 1.5-.6 2.2 0 1.3 1 1 4.6 2.5 4.6 1.3 0 1.4-3.6 2-5.5.6-1.9 1.5-3.3 1.5-5.4 0-2.5-1.6-4.6-4.2-4.6-1.8 0-2.6.9-5.1.9S8.8 4.5 7 4.5z" />
        </svg>
        {!reduceMotion ? (
          <motion.div
            className="dv-scanner-beam"
            animate={{ top: ["8%", "88%", "8%"], opacity: ready ? 0 : [0.4, 1, 0.4] }}
            transition={{
              top: { duration: 2.6, ease: "easeInOut", repeat: Infinity },
              opacity: ready ? { duration: 0.4 } : { duration: 2.6, ease: "easeInOut", repeat: Infinity },
            }}
          />
        ) : null}
      </div>

      <p className="dv-scanner-status">
        <span className={`dv-scanner-dot${ready ? " is-ready" : ""}`} />
        {PHASES[current].label}
        {ready ? null : "…"}
      </p>

      <ul className="dv-scanner-chips">
        {CONDITIONS.map((name, index) => {
          const done = ready || (current === 1 && index < checking);
          const active = current === 1 && index === checking;
          return (
            <li key={name} className={`${done ? "is-done" : ""}${active ? " is-active" : ""}`}>
              {done ? (
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                  <path d="M3.5 8.2 6.4 11l6.1-6.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="dv-scanner-chip-dot" />
              )}
              {name}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
