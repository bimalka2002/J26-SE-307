"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";

const floatCards = [
  {
    title: "Oral Scan Analysis",
    price: "Free",
    meta: "1.2k Users",
    side: "left" as const,
  },
  {
    title: "Risk Insights",
    price: "AI",
    meta: "840 Reports",
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

      <motion.div
        className="dv-hero-meta"
        initial={reduceMotion ? false : { opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.45, ease: easeOut }}
      >
        <div className="dv-hero-meta-block">
          <span>Today</span>
          <strong>We’re open for scans</strong>
          <span>09 AM – 16 PM</span>
        </div>
        <div className="dv-location">
          <span className="dv-pin" aria-hidden />
          Colombo, LK
        </div>
      </motion.div>

      <motion.aside
        className="dv-social"
        aria-label="Social"
        initial={reduceMotion ? false : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, delay: 0.55, ease: easeOut }}
      >
        {["𝕏", "⌇", "○"].map((icon, index) => (
          <motion.a
            key={icon}
            href="#contact"
            aria-label={["X", "Instagram", "Website"][index]}
            whileHover={reduceMotion ? undefined : { scale: 1.08, y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          >
            {icon}
          </motion.a>
        ))}
      </motion.aside>

      <div className="dv-hero-grid">
        <motion.div
          className="dv-hero-left"
          variants={stagger}
          initial={reduceMotion ? "show" : "hidden"}
          animate="show"
        >
          <motion.p className="dv-badge" variants={fadeUp}>
            <span className="dv-badge-dot" aria-hidden />
            Trusted oral screening
          </motion.p>
          <motion.h1 className="dv-hero-title" variants={fadeUp}>
            <span className="dv-title-solid">Exceptional</span>
            <span className="dv-title-outline">Oral Care</span>
          </motion.h1>
          <motion.p className="dv-hero-copy" variants={fadeUp}>
            We combine AI-assisted analysis and clear reporting so every scan gives you
            timely, useful insight into your oral health.
          </motion.p>
          <motion.div variants={fadeUp}>
            <motion.div
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="dv-hero-cta-motion"
            >
              <Button href="/register" arrow className="dv-hero-cta">
                Get Started
              </Button>
            </motion.div>
          </motion.div>
          <motion.div className="dv-hero-stat-inline" variants={fadeUp}>
            <strong>• 827+</strong>
            <p>Transform your smile with early insights and exceptional oral awareness.</p>
          </motion.div>
        </motion.div>

        <div className="dv-hero-center">
          <motion.div
            className="dv-orbit"
            aria-hidden
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 22, ease: "linear", repeat: Infinity }
            }
          />

          {floatCards.map((card, index) => (
            <motion.article
              key={card.title}
              className={`dv-float-card dv-float-${card.side}`}
              initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.94 }}
              animate={
                reduceMotion
                  ? { opacity: 1, y: 0, scale: 1 }
                  : {
                      opacity: 1,
                      y: [0, index === 0 ? -8 : -10, 0],
                      scale: 1,
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0.01 }
                  : {
                      opacity: { duration: 0.55, delay: 0.55 + index * 0.12, ease: easeOut },
                      scale: { duration: 0.55, delay: 0.55 + index * 0.12, ease: easeOut },
                      y: {
                        duration: index === 0 ? 5.2 : 6,
                        ease: "easeInOut",
                        repeat: Infinity,
                        delay: 1.1 + index * 0.2,
                      },
                    }
              }
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            >
              <div>
                <h3>{card.title}</h3>
                <p>{card.meta}</p>
              </div>
              <strong>{card.price}</strong>
            </motion.article>
          ))}
        </div>

        <motion.div
          className="dv-hero-right"
          variants={stagger}
          initial={reduceMotion ? "show" : "hidden"}
          animate="show"
        >
          <motion.h2 className="dv-hero-title dv-hero-title-right" variants={fadeUp}>
            <span className="dv-title-solid">&amp; Clear</span>
            <span className="dv-title-outline">Insights</span>
          </motion.h2>
          <motion.div className="dv-hero-stats" variants={stagger}>
            <motion.div variants={fadeUp}>
              <strong>170+</strong>
              <span>Scans completed</span>
            </motion.div>
            <motion.div variants={fadeUp}>
              <strong>85%</strong>
              <span>Satisfied users</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
