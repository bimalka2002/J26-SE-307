"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

const steps = [
  {
    value: "01",
    title: "Create your account",
    text: "Sign up or sign in to OralScan so your uploads and screening results stay private and linked to you.",
  },
  {
    value: "02",
    title: "Upload oral images",
    text: "Add an intraoral photo and, if you have one, a dental X-ray. Well-lit, in-focus images give the models the best chance.",
  },
  {
    value: "03",
    title: "AI models run screening",
    text: "Specialist models check for signs linked to OLP, OSMF, leukoplakia/erythroplakia (ELP), and caries.",
  },
  {
    value: "04",
    title: "Review your findings",
    text: "See a clear result for each condition in your account. Use it as screening support, then follow up with a qualified clinician.",
  },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOut },
  },
};

const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

export function HowItWorks() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="how-it-works" className="dv-how">
      <motion.div
        className="dv-how-inner"
        variants={stagger}
        initial={reduceMotion ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
      >
        <motion.div className="dv-how-head" variants={fadeUp}>
          <p className="dv-how-eyebrow">How it works</p>
          <h2>From upload to screening results in four steps</h2>
          <p>
            Create an account, add your images, and review the findings. Most of the work is
            choosing a clear photo.
          </p>
        </motion.div>

        <motion.ol className="dv-how-steps" variants={stagger}>
          {steps.map((step) => (
            <motion.li key={step.value} className="dv-how-step" variants={fadeUp}>
              <div className="dv-how-step-num" aria-hidden>
                {step.value}
              </div>
              <h3>
                <span className="sr-only">Step {Number(step.value)}: </span>
                {step.title}
              </h3>
              <p>{step.text}</p>
            </motion.li>
          ))}
        </motion.ol>

        <motion.div className="dv-how-note" variants={fadeUp}>
          <p>
            Screening support only. OralScan does not replace clinical diagnosis. Discuss results
            with a qualified clinician.
          </p>
          <AnimatedButton href="/register">Create account</AnimatedButton>
        </motion.div>
      </motion.div>
    </section>
  );
}
