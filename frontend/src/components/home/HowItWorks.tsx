"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useState } from "react";
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
    text: "Add an intraoral photo and, if available, a dental X-ray. Clear images help the models analyse more reliably.",
  },
  {
    value: "03",
    title: "AI models run screening",
    text: "Specialist models check for signs linked to OLP, OSMF, leukoplakia/erythroplakia (ELP), and caries.",
  },
  {
    value: "04",
    title: "Review your findings",
    text: "See structured results in your account. Use them as screening support, then follow up with a qualified clinician.",
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
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (reduceMotion || !inView) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % steps.length);
    }, 1300);
    return () => window.clearInterval(id);
  }, [reduceMotion, inView]);

  return (
    <section id="how-it-works" className="dv-how">
      <motion.div
        className="dv-how-inner"
        variants={stagger}
        initial={reduceMotion ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        onViewportEnter={() => setInView(true)}
      >
        <motion.div className="dv-how-head" variants={fadeUp}>
          <p className="dv-how-eyebrow">How it works</p>
          <h2>From upload to screening results in four steps</h2>
          <p>
            OralScan is built for oral disease identification. Follow this path to run an AI-assisted
            screen and review findings securely.
          </p>
        </motion.div>

        <motion.div className="dv-how-workflow" variants={fadeUp}>
          <div className="dv-how-rail" aria-hidden>
            <motion.div
              className="dv-how-rail-fill"
              initial={reduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, ease: easeOut, delay: 0.1 }}
            />
            {!reduceMotion ? (
              <motion.span
                className="dv-how-rail-dot"
                animate={{ left: `${(active / (steps.length - 1)) * 100}%` }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
              />
            ) : null}
          </div>

          <motion.ol className="dv-how-steps" variants={stagger}>
            {steps.map((step, index) => {
              const isActive = reduceMotion ? true : index === active;
              const isDone = reduceMotion ? false : index < active;

              return (
                <motion.li
                  key={step.value}
                  className={`dv-how-step${isActive ? " is-active" : ""}${isDone ? " is-done" : ""}`}
                  variants={fadeUp}
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          scale: isActive ? 1.02 : 1,
                          y: isActive ? -4 : 0,
                        }
                  }
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  {index < steps.length - 1 ? (
                    <motion.span
                      className="dv-how-connector"
                      aria-hidden
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              opacity: index < active ? 1 : 0.35,
                            }
                      }
                    >
                      <motion.span
                        className="dv-how-connector-flow"
                        animate={
                          reduceMotion
                            ? undefined
                            : index === active
                              ? { x: ["0%", "100%"], opacity: [0, 1, 0] }
                              : { x: "0%", opacity: 0 }
                        }
                        transition={
                          index === active
                            ? { duration: 0.65, ease: "easeInOut", repeat: Infinity }
                            : { duration: 0.2 }
                        }
                      />
                    </motion.span>
                  ) : null}

                  <motion.div
                    className="dv-how-step-num"
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            backgroundColor: isActive || isDone ? "#3b82f6" : "#dbeafe",
                            color: isActive || isDone ? "#ffffff" : "#3b82f6",
                            boxShadow: isActive
                              ? "0 0 0 6px rgba(59,130,246,0.18)"
                              : "0 0 0 0px rgba(59,130,246,0)",
                          }
                    }
                    transition={{ duration: 0.2 }}
                  >
                    {isDone && !isActive ? (
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden>
                        <path
                          d="M3.5 8.2 6.4 11l6.1-6.4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      step.value
                    )}
                  </motion.div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </motion.li>
              );
            })}
          </motion.ol>
        </motion.div>

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
