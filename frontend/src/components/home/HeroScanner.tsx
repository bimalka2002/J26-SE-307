"use client";

import { motion, useReducedMotion } from "motion/react";

// Decorative scan: a tooth inside a scanning frame, with a beam sweeping over it.
export function HeroScanner() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="dv-scanner" aria-hidden>
      <span className="dv-scanner-corner is-tl" />
      <span className="dv-scanner-corner is-tr" />
      <span className="dv-scanner-corner is-bl" />
      <span className="dv-scanner-corner is-br" />
      <div className="dv-scanner-grid" />

      <motion.svg
        className="dv-scanner-tooth"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinejoin="round"
        strokeLinecap="round"
        animate={reduceMotion ? undefined : { opacity: [0.75, 1, 0.75] }}
        transition={reduceMotion ? undefined : { duration: 2.6, ease: "easeInOut", repeat: Infinity }}
      >
        <path d="M7 4.5c-2.6 0-4.2 2.1-4.2 4.6 0 2.1.9 3.5 1.5 5.4.6 1.9.7 5.5 2 5.5 1.5 0 1.2-3.6 2.5-4.6.7-.6 1.5-.6 2.2 0 1.3 1 1 4.6 2.5 4.6 1.3 0 1.4-3.6 2-5.5.6-1.9 1.5-3.3 1.5-5.4 0-2.5-1.6-4.6-4.2-4.6-1.8 0-2.6.9-5.1.9S8.8 4.5 7 4.5z" />
      </motion.svg>

      {!reduceMotion ? (
        <motion.div
          className="dv-scanner-beam"
          animate={{ top: ["8%", "88%", "8%"], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity }}
        />
      ) : null}
    </div>
  );
}
