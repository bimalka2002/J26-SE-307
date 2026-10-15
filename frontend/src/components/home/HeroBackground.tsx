"use client";

import { useReducedMotion } from "motion/react";
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
      /* autoplay can be blocked; poster/fallback still shows */
    });
  }, [reduceMotion]);

  return (
    <div className="dv-hero-bg" aria-hidden>
      <video
        ref={videoRef}
        className="dv-hero-video"
        src="/videos/hero.mp4"
        muted
        loop
        playsInline
        autoPlay={!reduceMotion}
        preload="metadata"
      />
      <div className="dv-hero-video-overlay" />
    </div>
  );
}
