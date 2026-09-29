"use client";
import { useEffect } from "react";

// Only tiles and product cards fade in on scroll. Everything else stays still,
// so the hero remains the one big moment.
const TARGETS = ".collection-tiles>button,.p-card";

export default function Reveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const seen = new WeakSet<Element>();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let frame = 0;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          io.unobserve(el);
          el.classList.add("rv-in");
          // clean up so hover styles/transitions behave normally afterwards
          const timer = setTimeout(() => {
            el.classList.remove("rv", "rv-in");
            timers.delete(timer);
          }, 1000);
          timers.add(timer);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>(TARGETS).forEach((el, i) => {
        if (seen.has(el)) return;
        seen.add(el);
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92 && r.bottom > 0) return; // already on screen
        el.style.setProperty("--rv-d", `${(i % 4) * 90}ms`);
        el.classList.add("rv");
        io.observe(el);
      });
    };

    scan();
    // products load asynchronously and the view changes without page reloads
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
}

