"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

const scanStatuses = ["Scanning", "Analysing", "Matching", "Ready"];

const floatCards = [
  {
    title: "Disease screening",
    price: "AI",
    meta: "Photo & X-ray",
    side: "left" as const,
  },
  {
    title: "Clear findings",
    price: "Report",
    meta: "Per-condition scores",
    side: "right" as const,
  },
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
  const [scanIndex, setScanIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const watermarkY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -40]);
  const watermarkOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.15]);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setScanIndex((i) => (i + 1) % scanStatuses.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

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
          <motion.div className="dv-hero-stat-inline" variants={fadeUp}>
            <strong>• Early signals</strong>
            <p>Screening support only, not a replacement for clinical diagnosis.</p>
          </motion.div>
        </motion.div>

        <motion.div
          className="dv-hero-center"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: easeOut }}
        >
          <motion.div
            className="dv-orbit dv-orbit-outer"
            aria-hidden
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={
              reduceMotion ? undefined : { duration: 28, ease: "linear", repeat: Infinity }
            }
          >
            <span className="dv-orbit-dot dv-orbit-dot-a" />
            <span className="dv-orbit-dot dv-orbit-dot-b" />
          </motion.div>

          <motion.div
            className="dv-orbit dv-orbit-inner"
            aria-hidden
            animate={reduceMotion ? undefined : { rotate: -360 }}
            transition={
              reduceMotion ? undefined : { duration: 18, ease: "linear", repeat: Infinity }
            }
          >
            <span className="dv-orbit-dot dv-orbit-dot-c" />
          </motion.div>

          <motion.div
            className="dv-scan-ring"
            aria-hidden
            animate={
              reduceMotion
                ? undefined
                : { scale: [0.92, 1.08, 0.92], opacity: [0.35, 0.7, 0.35] }
            }
            transition={
              reduceMotion
                ? undefined
                : { duration: 4.2, ease: "easeInOut", repeat: Infinity }
            }
          />

          <motion.div
            className="dv-scan-core"
            aria-hidden
            animate={reduceMotion ? undefined : { scale: [1, 1.06, 1], opacity: [0.45, 0.75, 0.45] }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 3.4, ease: "easeInOut", repeat: Infinity, delay: 0.4 }
            }
          />

          <motion.div
            className="dv-scan-sweep"
            aria-hidden
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={
              reduceMotion ? undefined : { duration: 6.5, ease: "linear", repeat: Infinity }
            }
          />

          <div className="dv-scan-frame" aria-hidden>
            <span className="dv-scan-corner dv-scan-tl" />
            <span className="dv-scan-corner dv-scan-tr" />
            <span className="dv-scan-corner dv-scan-bl" />
            <span className="dv-scan-corner dv-scan-br" />
            <div className="dv-scan-grid" />
            <motion.div
              className="dv-scan-beam"
              animate={
                reduceMotion
                  ? undefined
                  : { top: ["8%", "88%", "8%"], opacity: [0.35, 0.95, 0.35] }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 3.2, ease: "easeInOut", repeat: Infinity }
              }
            />
            <div className="dv-scan-crosshair">
              <span />
              <span />
            </div>
          </div>

          <div className="dv-scan-status" aria-hidden>
            <span className="dv-scan-status-dot" />
            <AnimatePresence mode="wait">
              <motion.span
                key={reduceMotion ? "Scanning" : scanStatuses[scanIndex]}
                className="dv-scan-status-label"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: easeOut }}
              >
                {reduceMotion ? "Scanning" : scanStatuses[scanIndex]}
              </motion.span>
            </AnimatePresence>
            <span className="dv-scan-status-dots">...</span>
          </div>

          {floatCards.map((card, index) => (
            <motion.article
              key={card.title}
              className={`dv-float-card dv-float-${card.side}`}
              initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.9, x: index === 0 ? -16 : 16 }}
              animate={
                reduceMotion
                  ? { opacity: 1, y: 0, scale: 1, x: 0 }
                  : {
                      opacity: 1,
                      x: index === 0 ? [0, 6, 0] : [0, -6, 0],
                      y: [0, index === 0 ? -12 : -14, 0],
                      scale: 1,
                      rotate: index === 0 ? [0, -1.2, 0] : [0, 1.2, 0],
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0.01 }
                  : {
                      opacity: { duration: 0.6, delay: 0.5 + index * 0.14, ease: easeOut },
                      scale: { duration: 0.6, delay: 0.5 + index * 0.14, ease: easeOut },
                      x: {
                        duration: index === 0 ? 5.6 : 6.4,
                        ease: "easeInOut",
                        repeat: Infinity,
                        delay: 1.2 + index * 0.25,
                      },
                      y: {
                        duration: index === 0 ? 4.8 : 5.6,
                        ease: "easeInOut",
                        repeat: Infinity,
                        delay: 1 + index * 0.2,
                      },
                      rotate: {
                        duration: index === 0 ? 6 : 6.8,
                        ease: "easeInOut",
                        repeat: Infinity,
                        delay: 1.3 + index * 0.2,
                      },
                    }
              }
              whileHover={reduceMotion ? undefined : { scale: 1.05, y: -4 }}
            >
              <div>
                <h3>{card.title}</h3>
                <p>{card.meta}</p>
              </div>
              <strong>{card.price}</strong>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          className="dv-hero-right"
          variants={stagger}
          initial={reduceMotion ? "show" : "hidden"}
          animate="show"
        >
          <motion.h2 className="dv-hero-title dv-hero-title-right" variants={fadeUp}>
            <span className="dv-title-solid">&amp; Act</span>
            <span className="dv-title-outline">Earlier</span>
          </motion.h2>
          <motion.div className="dv-hero-stats" variants={stagger}>
            <motion.div variants={fadeUp}>
              <strong>4+</strong>
              <span>Condition models</span>
            </motion.div>
            <motion.div variants={fadeUp}>
              <strong>2</strong>
              <span>Image modalities</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
