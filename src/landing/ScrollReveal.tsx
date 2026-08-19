"use client";

import { useEffect } from "react";

// ScrollReveal — reveals any [data-reveal] element as it scrolls into view.
// Renders nothing; it only wires up an IntersectionObserver. The initial
// hidden state lives behind `.reveal-ready` (added here), so the page is fully
// visible if JS never runs or the user prefers reduced motion.
export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.documentElement.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );

    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
