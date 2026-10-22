"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "#home", id: "home", label: "Home" },
  { href: "#how-it-works", id: "how-it-works", label: "How it works" },
  { href: "#conditions", id: "conditions", label: "Conditions" },
  { href: "#features", id: "features", label: "Why OralScan" },
  { href: "#faq", id: "faq", label: "FAQ" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 48);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = links
      .map((link) => document.getElementById(link.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.1, 0.35, 0.6],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!scrolled) return;
    setOpen(false);
  }, [scrolled]);

  return (
    <motion.header
      className={`dv-nav${scrolled ? " is-scrolled" : ""}`}
      initial={false}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
    >
      <div className="dv-nav-inner">
        <Link href="#home" className="dv-logo" onClick={() => setOpen(false)}>
          OralScan
        </Link>

        <nav className="dv-nav-links" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={active === link.id ? "is-active" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="dv-nav-actions">
          <Link href="/register" className="dv-nav-secondary">
            Get Started
          </Link>
          <AnimatedButton href="/login" className="dv-nav-signin">
            Sign In
          </AnimatedButton>
        </div>

        <button
          type="button"
          className="dv-nav-toggle"
          aria-expanded={open}
          aria-controls="dv-mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className={open ? "is-open" : undefined} />
        </button>
      </div>

      {open ? (
        <div id="dv-mobile-nav" className="dv-mobile-nav">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={active === link.id ? "is-active" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Button href="/login" onClick={() => setOpen(false)}>
            Sign In
          </Button>
          <Button href="/register" onClick={() => setOpen(false)}>
            Get Started
          </Button>
        </div>
      ) : null}
    </motion.header>
  );
}
