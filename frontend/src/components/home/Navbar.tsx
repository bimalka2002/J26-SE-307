"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "#home", label: "Home" },
  { href: "#services", label: "Our Services" },
  { href: "#membership", label: "Membership" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="dv-nav">
      <div className="dv-nav-inner">
        <Link href="#home" className="dv-logo" onClick={() => setOpen(false)}>
          <span className="dv-logo-mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="9" cy="12" r="4" />
              <circle cx="15" cy="12" r="4" />
            </svg>
          </span>
          OralScan
        </Link>

        <nav className="dv-nav-links" aria-label="Primary">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="dv-nav-actions">
          <button type="button" className="dv-lang" aria-label="Language">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.8 2.5 15.2 0 18M12 3c-2.5 2.8-2.5 15.2 0 18" />
            </svg>
            EN
          </button>
          <Button href="/login" className="dv-nav-signin">
            Sign In
          </Button>
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
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
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
    </header>
  );
}
