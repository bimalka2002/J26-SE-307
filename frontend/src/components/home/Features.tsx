"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

const signalTags = [
  "OLP",
  "OSMF",
  "ELP",
  "Caries",
  "Photo",
  "X-ray",
  "AI models",
  "Findings",
  "Secure",
  "Screening",
];

const particles = [
  { x: "8%", y: "22%", size: 4, delay: 0 },
  { x: "18%", y: "68%", size: 3, delay: 0.4 },
  { x: "28%", y: "18%", size: 5, delay: 0.8 },
  { x: "42%", y: "78%", size: 3, delay: 1.1 },
  { x: "55%", y: "14%", size: 4, delay: 0.2 },
  { x: "68%", y: "62%", size: 5, delay: 0.6 },
  { x: "78%", y: "28%", size: 3, delay: 1.4 },
  { x: "88%", y: "72%", size: 4, delay: 0.9 },
  { x: "12%", y: "48%", size: 3, delay: 1.7 },
  { x: "92%", y: "42%", size: 4, delay: 1.2 },
];

function IconScan({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <circle cx="12" cy="12" r="3.2" />
      <motion.path
        d="M3 10h18"
        animate={active ? { y: [0, 6, 0], opacity: [0.35, 1, 0.35] } : undefined}
        transition={active ? { duration: 2.2, ease: "easeInOut", repeat: Infinity } : undefined}
      />
    </svg>
  );
}

function IconModels({ active }: { active?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={active ? { rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] } : undefined}
      transition={active ? { duration: 3.6, ease: "easeInOut", repeat: Infinity } : undefined}
    >
      <path d="M12 3 4.5 7.5v9L12 21l7.5-4.5v-9L12 3Z" />
      <path d="M12 12 4.5 7.5M12 12l7.5-4.5M12 12v9" />
    </motion.svg>
  );
}

function IconFindings({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h6l4 4v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4" />
      <motion.path
        d="M9.5 12h5"
        initial={false}
        animate={active ? { pathLength: [0.2, 1, 0.2], opacity: [0.4, 1, 0.4] } : { pathLength: 1 }}
        transition={active ? { duration: 2.4, ease: "easeInOut", repeat: Infinity } : undefined}
      />
      <motion.path
        d="M9.5 15.5h5"
        initial={false}
        animate={active ? { pathLength: [0.2, 1, 0.2], opacity: [0.4, 1, 0.4] } : { pathLength: 1 }}
        transition={active ? { duration: 2.4, ease: "easeInOut", repeat: Infinity, delay: 0.25 } : undefined}
      />
      <path d="M9.5 8.5h2" />
    </svg>
  );
}

function IconSecure({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <motion.path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        animate={active ? { y: [0, -1.5, 0] } : undefined}
        transition={active ? { duration: 2.6, ease: "easeInOut", repeat: Infinity } : undefined}
      />
      <motion.circle
        cx="12"
        cy="16"
        r="1.2"
        fill="currentColor"
        stroke="none"
        animate={active ? { scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] } : undefined}
        transition={active ? { duration: 1.8, ease: "easeInOut", repeat: Infinity } : undefined}
      />
    </svg>
  );
}

const features: {
  icon: (active: boolean) => ReactNode;
  title: string;
  text: string;
  accent: string;
  chip: string;
}[] = [
  {
    icon: (active) => <IconScan active={active} />,
    title: "Photo & X-ray screening",
    text: "Upload an intraoral photo and optionally a dental X-ray so models can analyse what each modality shows best.",
    accent: "01",
    chip: "Capture",
  },
  {
    icon: (active) => <IconModels active={active} />,
    title: "Specialist disease models",
    text: "Dedicated models screen for OLP, OSMF, leukoplakia/erythroplakia (ELP), and caries from supported image types.",
    accent: "02",
    chip: "Detect",
  },
  {
    icon: (active) => <IconFindings active={active} />,
    title: "Structured findings",
    text: "Get clear per-condition outputs you can review in your account and bring into a conversation with a clinician.",
    accent: "03",
    chip: "Report",
  },
  {
    icon: (active) => <IconSecure active={active} />,
    title: "Secure account access",
    text: "Sign in to keep your uploads and analysis history private, organised, and ready for follow-up review.",
    accent: "04",
    chip: "Protect",
  },
];

const easeOut = [0.22, 1, 0.36, 1] as const;
const titleWords = ["What", "OralScan", "helps", "you", "do"];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 36, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: easeOut },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 56, scale: 0.92, rotateX: 12 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { duration: 0.8, ease: easeOut },
  },
};

const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const wordStagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 24, rotateX: 40 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
};

function FeatureCard({
  feature,
  index,
  reduceMotion,
  focused,
}: {
  feature: (typeof features)[number];
  index: number;
  reduceMotion: boolean | null;
  focused: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(0, { stiffness: 220, damping: 22 });
  const rotateY = useSpring(0, { stiffness: 220, damping: 22 });
  const spotlight = useMotionTemplate`radial-gradient(240px circle at ${mouseX}px ${mouseY}px, rgba(59, 130, 246, 0.2), transparent 55%)`;
  const glowOpacity = useTransform(rotateY, [-10, 0, 10], [0.35, 0.15, 0.35]);

  const onMove = (event: MouseEvent<HTMLElement>) => {
    if (reduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    mouseX.set(x);
    mouseY.set(y);
    const px = (x / rect.width - 0.5) * 2;
    const py = (y / rect.height - 0.5) * 2;
    rotateX.set(py * -7);
    rotateY.set(px * 9);
  };

  const onLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.article
      ref={cardRef}
      className={`dv-feature-card${focused ? " is-focused" : ""}`}
      variants={cardVariants}
      style={{
        rotateX: reduceMotion ? 0 : rotateX,
        rotateY: reduceMotion ? 0 : rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -10,
              transition: { type: "spring", stiffness: 320, damping: 22 },
            }
      }
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
    >
      {!reduceMotion ? (
        <>
          <motion.div className="dv-feature-spotlight" style={{ background: spotlight }} aria-hidden />
          <motion.div className="dv-feature-glow" style={{ opacity: glowOpacity }} aria-hidden />
        </>
      ) : null}

      <motion.span
        className="dv-feature-index"
        aria-hidden
        animate={focused && !reduceMotion ? { color: "#3b82f6", scale: 1.08 } : { scale: 1 }}
      >
        {feature.accent}
      </motion.span>

      <motion.div
        className="dv-feature-icon"
        aria-hidden
        animate={
          focused && !reduceMotion
            ? { scale: [1, 1.1, 1], rotate: [0, -4, 4, 0] }
            : undefined
        }
        transition={
          focused && !reduceMotion
            ? { duration: 1.8, ease: "easeInOut", repeat: Infinity }
            : { type: "spring", stiffness: 400, damping: 16 }
        }
      >
        <motion.div
          className="dv-feature-icon-pulse"
          animate={
            reduceMotion
              ? undefined
              : {
                  boxShadow: [
                    "0 0 0 0 rgba(59, 130, 246, 0)",
                    "0 0 0 10px rgba(59, 130, 246, 0.12)",
                    "0 0 0 0 rgba(59, 130, 246, 0)",
                  ],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 2.4, ease: "easeInOut", repeat: Infinity, delay: index * 0.35 }
          }
        >
          {feature.icon(!reduceMotion)}
        </motion.div>
      </motion.div>

      <motion.span
        className="dv-feature-chip"
        animate={
          focused && !reduceMotion
            ? { y: [0, -2, 0], backgroundColor: "rgba(59, 130, 246, 0.16)" }
            : { y: 0 }
        }
        transition={
          focused && !reduceMotion
            ? { duration: 1.6, ease: "easeInOut", repeat: Infinity }
            : undefined
        }
      >
        {feature.chip}
      </motion.span>

      <h3>{feature.title}</h3>
      <p>{feature.text}</p>

      <svg className="dv-feature-ring" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r="20" />
        <motion.circle
          cx="24"
          cy="24"
          r="20"
          initial={false}
          animate={{ pathLength: focused ? 1 : 0.18 }}
          transition={{ duration: 0.85, ease: easeOut }}
        />
      </svg>

      <motion.div
        className="dv-feature-bar"
        aria-hidden
        initial={reduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: focused || reduceMotion ? 1 : 0.35 }}
        transition={{ duration: 0.55, ease: easeOut }}
      />
    </motion.article>
  );
}

export function Features() {
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (reduceMotion || !inView) return;
    const id = window.setInterval(() => {
      setFocused((current) => (current + 1) % features.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, [reduceMotion, inView]);

  return (
    <section id="features" className="dv-features">
      <div className="dv-features-ambiance" aria-hidden>
        <motion.span
          className="dv-features-orb dv-features-orb-a"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.96, 1] }
          }
          transition={
            reduceMotion ? undefined : { duration: 14, ease: "easeInOut", repeat: Infinity }
          }
        />
        <motion.span
          className="dv-features-orb dv-features-orb-b"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -35, 25, 0], y: [0, 25, -15, 0], scale: [1, 0.94, 1.1, 1] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 16, ease: "easeInOut", repeat: Infinity, delay: 0.8 }
          }
        />
        <motion.span
          className="dv-features-orb dv-features-orb-c"
          animate={
            reduceMotion ? undefined : { rotate: [0, 25, -15, 0], opacity: [0.35, 0.55, 0.4, 0.35] }
          }
          transition={
            reduceMotion ? undefined : { duration: 12, ease: "easeInOut", repeat: Infinity }
          }
        />

        {!reduceMotion
          ? particles.map((particle, index) => (
              <motion.span
                key={index}
                className="dv-features-particle"
                style={{
                  left: particle.x,
                  top: particle.y,
                  width: particle.size,
                  height: particle.size,
                }}
                animate={{
                  y: [0, -18, 0],
                  opacity: [0.15, 0.75, 0.15],
                  scale: [1, 1.4, 1],
                }}
                transition={{
                  duration: 3.4 + index * 0.15,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: particle.delay,
                }}
              />
            ))
          : null}

        <div className="dv-features-scanfield" aria-hidden>
          <div className="dv-features-scan-grid" />
          <div className="dv-features-scan-frame">
            <span className="dv-features-scan-corner is-tl" />
            <span className="dv-features-scan-corner is-tr" />
            <span className="dv-features-scan-corner is-bl" />
            <span className="dv-features-scan-corner is-br" />
          </div>

          {!reduceMotion ? (
            <>
              <motion.div
                className="dv-features-scan-radar"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, ease: "linear", repeat: Infinity }}
              />
              <motion.div
                className="dv-features-scan-ring"
                animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.2, 0.55, 0.2] }}
                transition={{ duration: 4.8, ease: "easeInOut", repeat: Infinity }}
              />
              <motion.div
                className="dv-features-scan-ring is-inner"
                animate={{ scale: [1.05, 0.9, 1.05], opacity: [0.35, 0.15, 0.35] }}
                transition={{ duration: 3.6, ease: "easeInOut", repeat: Infinity, delay: 0.4 }}
              />
              <motion.div
                className="dv-features-scanline"
                animate={{ top: ["0%", "100%"], opacity: [0.2, 0.95, 0.2] }}
                transition={{ duration: 3.8, ease: "easeInOut", repeat: Infinity }}
              />
              <motion.div
                className="dv-features-scanline is-vertical"
                animate={{ left: ["0%", "100%"], opacity: [0.1, 0.55, 0.1] }}
                transition={{ duration: 6.2, ease: "easeInOut", repeat: Infinity, delay: 1.1 }}
              />
              <motion.div
                className="dv-features-scan-trace"
                animate={{ x: ["-20%", "120%"] }}
                transition={{ duration: 7, ease: "linear", repeat: Infinity }}
              />
            </>
          ) : (
            <div className="dv-features-scan-ring is-static" />
          )}
        </div>
      </div>

      <motion.div
        className="dv-features-inner"
        variants={stagger}
        initial={reduceMotion ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.16 }}
        onViewportEnter={() => setInView(true)}
        onViewportLeave={() => setInView(false)}
      >
        <motion.div className="dv-features-head" variants={fadeUp}>
          <motion.p
            className="dv-features-eyebrow"
            animate={reduceMotion ? undefined : { letterSpacing: ["0.14em", "0.22em", "0.14em"] }}
            transition={
              reduceMotion ? undefined : { duration: 4.5, ease: "easeInOut", repeat: Infinity }
            }
          >
            Features
          </motion.p>

          <motion.h2 variants={wordStagger} initial={reduceMotion ? "show" : "hidden"} whileInView="show" viewport={{ once: true }}>
            {titleWords.map((word) => (
              <motion.span
                key={word}
                className={`dv-features-word${word === "helps" || word === "do" ? " is-accent" : ""}`}
                variants={wordVariants}
              >
                {word}
              </motion.span>
            ))}
          </motion.h2>

          <p>
            Practical screening tools focused on identifying oral disease signals, not memberships
            or clinic booking.
          </p>
        </motion.div>

        {!reduceMotion ? (
          <div className="dv-features-marquee" aria-hidden>
            <motion.div
              className="dv-features-marquee-track"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 22, ease: "linear", repeat: Infinity }}
            >
              {[...signalTags, ...signalTags].map((tag, index) => (
                <span key={`${tag}-${index}`} className="dv-features-tag">
                  <i />
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>
        ) : null}

        <motion.div className="dv-features-grid" variants={stagger} style={{ perspective: 1400 }}>
          {features.map((feature, index) => (
            <div
              key={feature.title}
              onMouseEnter={() => setFocused(index)}
              onFocus={() => setFocused(index)}
            >
              <FeatureCard
                feature={feature}
                index={index}
                reduceMotion={reduceMotion}
                focused={focused === index}
              />
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
