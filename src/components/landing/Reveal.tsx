"use client";

// Tiny IntersectionObserver-based reveal. Lets the page feel cinematic
// without pulling in a motion library. Respects prefers-reduced-motion
// via CSS overrides in landing.module.css.

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./landing.module.css";

interface RevealProps {
  children: ReactNode;
  /** ms after which the element reveals (capped by `delay`). */
  delay?: number;
  /** Extra classes to merge in (e.g. spacing utilities). */
  className?: string;
}

export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Start revealed when the user prefers reduced motion — the page should
  // never animate on demand in that case.
  const [shown, setShown] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // If reduced-motion was set on the client but we missed the lazy
    // initializer, mark as revealed now and skip the observer.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;
    if (typeof IntersectionObserver === "undefined") {
      // Older browsers — reveal on the next microtask rather than hiding
      // forever. queueMicrotask defers the state update out of the effect
      // body to avoid a cascading render.
      queueMicrotask(() => setShown(true));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            window.setTimeout(() => setShown(true), delay);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${shown ? styles.in : ""} ${className}`}
    >
      {children}
    </div>
  );
}
