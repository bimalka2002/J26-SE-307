"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const iconProps = {
  viewBox: "0 0 24 24",
  width: 24,
  height: 24,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const features: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <circle cx="12" cy="12" r="3.2" />
      </svg>
    ),
    title: "Use the images you have",
    text: "Upload an oral photo, a dental X-ray, or both. Each image goes to the models that read it best.",
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M12 3 4.5 7.5v9L12 21l7.5-4.5v-9L12 3Z" />
        <path d="M12 12 4.5 7.5M12 12l7.5-4.5M12 12v9" />
      </svg>
    ),
    title: "One model per condition",
    text: "Separate models check for OLP, OSMF, leukoplakia/erythroplakia, and caries, so each condition gets its own result.",
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M8 3h6l4 4v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
        <path d="M14 3v4h4M9.5 12h5M9.5 15.5h5" />
      </svg>
    ),
    title: "Results you can share",
    text: "Get a clear finding for each condition that you can review again later and bring to a clinician.",
  },
  {
    icon: (
      <svg {...iconProps}>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    ),
    title: "Tied to your account",
    text: "Your uploads and results are linked to your signed-in account, so you can come back to them.",
  },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

export function Features() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="features" className="dv-features">
      <motion.div
        className="dv-features-inner"
        variants={stagger}
        initial={reduceMotion ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.16 }}
      >
        <motion.div className="dv-section-head" variants={fadeUp}>
          <p className="dv-section-eyebrow">Why OralScan</p>
          <h2>An early look, made simple</h2>
          <p>
            Check for early warning signs from a photo, and know when it is time to see a
            clinician.
          </p>
        </motion.div>

        <motion.ul className="dv-features-grid" variants={stagger}>
          {features.map((feature) => (
            <motion.li key={feature.title} className="dv-feature-card" variants={fadeUp}>
              <span className="dv-feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}
