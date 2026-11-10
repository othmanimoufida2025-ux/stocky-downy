"use client";

import { useState, useEffect, useCallback } from "react";

type Category = {
  id?: string | number;
  name: string;
  image?: string;
  product_count?: number;
};

type Props = {
  categories: Category[];
  /** children = the hero copy (heading, buttons, proof) */
  children: React.ReactNode;
};

const FALLBACK = "/demo-fashion.svg";
const INTERVAL_MS = 4500;

export function HeroCarousel({ categories, children }: Props) {
  const slides = categories.filter((c) => c.image).length > 0
    ? categories.filter((c) => c.image)
    : categories;

  const count = slides.length;
  const [active, setActive] = useState(0);
  const [prev, setPrev]     = useState<number | null>(null);
  const [fading, setFading] = useState(false);

  const advance = useCallback(
    (next: number) => {
      if (fading || count < 2) return;
      setFading(true);
      setPrev(active);
      setActive(next);
      setTimeout(() => {
        setPrev(null);
        setFading(false);
      }, 900);
    },
    [active, fading, count]
  );

  /* Auto-advance */
  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(() => {
      advance((active + 1) % count);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [active, advance, count]);

  if (!slides.length) return <>{children}</>;

  return (
    <div className="hc-wrap">
      {/* Background images layer */}
      <div className="hc-bg" aria-hidden="true">
        {slides.map((cat, i) => (
          <div
            key={cat.id ?? cat.name}
            className={`hc-slide${i === active ? " hc-slide-active" : ""}${i === prev ? " hc-slide-prev" : ""}`}
          >
            <img
              src={cat.image || FALLBACK}
              alt=""
              className="hc-slide-img"
            />
          </div>
        ))}

        {/* Vignette layers for text safety */}
        <div className="hc-vignette" aria-hidden="true" />
      </div>

      {/* Hero copy on top */}
      <div className="hc-content">
        {children}
      </div>

      {/* Slide dots */}
      {count > 1 && (
        <div className="hc-dots" aria-label="Catégories">
          {slides.map((cat, i) => (
            <button
              key={cat.id ?? cat.name}
              className={`hc-dot${i === active ? " hc-dot-active" : ""}`}
              aria-label={cat.name}
              aria-pressed={i === active}
              onClick={() => advance(i)}
            />
          ))}
        </div>
      )}

      {/* Category name label — bottom right */}
      <div className="hc-cat-label" aria-live="polite">
        <span className="hc-cat-name" key={active}>{slides[active].name}</span>
        {(slides[active].product_count ?? 0) > 0 && (
          <span className="hc-cat-count">{slides[active].product_count} pièces</span>
        )}
      </div>
    </div>
  );
}
