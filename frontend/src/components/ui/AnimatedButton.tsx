"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnimatedButtonProps = {
  children?: ReactNode;
  className?: string;
  href?: string;
  arrow?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function AnimatedButton({
  children = "Get Started",
  className = "",
  href,
  arrow = false,
  onClick,
  type = "button",
  disabled,
}: AnimatedButtonProps) {
  const classes = cn("dv-animated-btn", className);

  const body = (
    <>
      <span aria-hidden className="dv-animated-btn-shine" />
      <span className="dv-animated-btn-label">
        <span>{children}</span>
        {arrow ? (
          <span className="dv-btn-arrow" aria-hidden>
            →
          </span>
        ) : null}
      </span>
    </>
  );

  if (href) {
    return (
      <motion.div
        className="dv-animated-btn-wrap"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
      >
        <Link href={href} className={classes} onClick={onClick}>
          {body}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classes}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
    >
      {body}
    </motion.button>
  );
}

export default AnimatedButton;
