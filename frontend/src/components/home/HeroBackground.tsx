"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

export function HeroBackground() {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (reduceMotion) {
      video.pause();
      video.removeAttribute("autoplay");
      return;
    }

    void video.play().catch(() => {
      /* autoplay can be blocked; overlay still covers the area */
    });
  }, [reduceMotion]);

  return (
    <div className="dv-hero-bg" aria-hidden>
      <motion.div
        className="dv-hero-video-frame"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <video
          ref={videoRef}
          className="dv-hero-video"
          src="/videos/hero.mp4"
          muted
          loop
          playsInline
          autoPlay={!reduceMotion}
          preload="auto"
        />
      </motion.div>
      <div className="dv-hero-video-overlay" />
    </div>
  );
}
