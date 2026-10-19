"use client";

import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "motion/react";
import { useRef } from "react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { SampleResultCard } from "@/components/home/SampleResultCard";

const benefits = [
  "Upload a photo, an X-ray, or both",
  "A clear result for each of 4 conditions",
  "Results saved to your private account",
];

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOut },
  },
};

const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

export function Hero() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const watermarkY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -40]);
  const watermarkOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.15]);

  return (
    <section id="home" className="dv-hero" ref={sectionRef}>
      <motion.p className="dv-watermark" aria-hidden style={{ y: watermarkY, opacity: watermarkOpacity }}>
        OralScan
      </motion.p>

      <div className="dv-hero-grid">
        <motion.div
          className="dv-hero-left"
          variants={stagger}
          initial={reduceMotion ? "show" : "hidden"}
          animate="show"
        >
          <motion.h1 className="dv-hero-title" variants={fadeUp}>
            <span className="dv-title-solid">Detect</span>
            <span className="dv-title-outline">Oral Disease</span>
            <span className="dv-title-solid dv-title-extra">&amp; Act Earlier</span>
          </motion.h1>
          <motion.p className="dv-hero-copy" variants={fadeUp}>
            OralScan uses specialist AI models to screen oral photos and dental X-rays for signs of
            conditions such as OLP, OSMF, leukoplakia/erythroplakia, and caries.
          </motion.p>
          <motion.div variants={fadeUp} className="dv-hero-cta-motion">
            <AnimatedButton href="/register" arrow className="dv-hero-cta">
              Get Started
            </AnimatedButton>
          </motion.div>
          <motion.p className="dv-hero-note" variants={fadeUp}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" />
            </svg>
            <span>
              <strong>Screening support only.</strong> It is not a diagnosis. Always follow up with a
              qualified clinician.
            </span>
          </motion.p>
        </motion.div>

        <motion.div
          className="dv-hero-center"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
        >
          <SampleResultCard />
        </motion.div>

        <motion.div
          className="dv-hero-right"
          variants={stagger}
          initial={reduceMotion ? "show" : "hidden"}
          animate="show"
        >
          <motion.p className="dv-hero-title dv-hero-title-right" variants={fadeUp} aria-hidden>
            <span className="dv-title-solid">&amp; Act</span>
            <span className="dv-title-outline">Earlier</span>
          </motion.p>
          <motion.ul className="dv-hero-benefits" variants={fadeUp}>
            {benefits.map((benefit) => (
              <li key={benefit}>
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden>
                  <path
                    d="M3.5 8.2 6.4 11l6.1-6.4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {benefit}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  );
}
