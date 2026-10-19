"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

const conditions = [
  {
    abbr: "OLP",
    name: "Oral lichen planus",
    text: "A long-term inflammatory condition that can cause white, lacy patches or red, sore areas inside the mouth.",
    input: "Oral photo",
  },
  {
    abbr: "OSMF",
    name: "Oral submucous fibrosis",
    text: "The tissue inside the mouth becomes stiff, which can make it hard to open wide. It is often linked to chewing areca nut (betel quid).",
    input: "Oral photo",
  },
  {
    abbr: "ELP",
    name: "Leukoplakia and erythroplakia",
    text: "White or red patches that cannot be wiped away. Some can turn cancerous over time, so they are worth checking early.",
    input: "Oral photo",
  },
  {
    abbr: "Caries",
    name: "Tooth decay",
    text: "Cavities caused by decay. They are often easiest to spot on a dental X-ray.",
    input: "Dental X-ray",
  },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export function Conditions() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="conditions" className="dv-conditions">
      <motion.div
        className="dv-conditions-inner"
        variants={stagger}
        initial={reduceMotion ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div className="dv-section-head" variants={fadeUp}>
          <p className="dv-section-eyebrow">What we screen for</p>
          <h2>Four conditions, explained simply</h2>
          <p>
            OralScan looks for visual signs of these conditions. Finding a sign does not mean you
            have the condition, only that a check-up is worth booking.
          </p>
        </motion.div>

        <motion.ul className="dv-conditions-grid" variants={stagger}>
          {conditions.map((item) => (
            <motion.li key={item.abbr} className="dv-condition-card" variants={fadeUp}>
              <span className="dv-condition-abbr">{item.abbr}</span>
              <h3>{item.name}</h3>
              <p>{item.text}</p>
              <span className="dv-condition-input">Uses: {item.input}</span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}
