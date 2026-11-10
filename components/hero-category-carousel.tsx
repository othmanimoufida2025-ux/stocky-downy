"use client";

import { useState, useEffect, useRef, useCallback, TouchEvent } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Truck } from "lucide-react";

type Category = {
  id?: string | number;
  name: string;
  slug?: string;
  image?: string;
  product_count?: number;
};

type HeroCopyProps = {
  shopCount: number;
  productCount: number;
};

export function HeroCategoryCarousel({
  categories,
  heroCopy,
}: {
  categories: Category[];
  heroCopy: HeroCopyProps;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const count = categories.length;

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(() => setActive((p) => (p + 1) % count), 3000);
    return () => clearInterval(id);
  }, [paused, count]);

  const prev = useCallback(() => setActive((p) => (p - 1 + count) % count), [count]);
  const next = useCallback(() => setActive((p) => (p + 1) % count), [count]);

  function onTouchStart(e: TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function onTouchMove(e: TouchEvent) {
    if (touchStartX.current === null) return;
    setDragOffset(e.touches[0].clientX - touchStartX.current);
  }
  function onTouchEnd() {
    if (Math.abs(dragOffset) > 50) dragOffset < 0 ? next() : prev();
    touchStartX.current = null;
    setDragOffset(0);
  }

  const fallback = "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1400&q=80";
  const cat = categories[active];

  return (
    <div
      className="hcc-root"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      aria-label="Galerie des catégories"
    >
      {/* ── Slide backgrounds ─────────────────────────── */}
      {categories.map((c, i) => (
        <div
          key={c.id ?? c.name}
          className="hcc-slide"
          aria-hidden={i !== active}
          style={{
            opacity: i === active ? 1 : 0,
            backgroundImage: `url(${c.image || fallback})`,
            transform: `translateX(${i === active ? dragOffset * 0.04 : 0}px) scale(${i === active ? 1 : 1.04})`,
          }}
        />
      ))}

      {/* ── Layered veils for depth & legibility ──────── */}
      {/* Left veil: heavy dark band behind the copy */}
      <div className="hcc-veil-left" />
      {/* Bottom veil: dark band behind category name */}
      <div className="hcc-veil-bottom" />
      {/* Radial vignette */}
      <div className="hcc-veil-vignette" />

      {/* ── Accent dots ───────────────────────────────── */}
      <span className="hcc-dot hcc-dot-amber" />
      <span className="hcc-dot hcc-dot-teal" />

      {/* ═══════════════════════════════════════════════════
          TOP-LEFT: Brand copy — eyebrow / h1 / lead / CTA
      ════════════════════════════════════════════════════ */}
      <div className="hcc-hero-copy">
        <h1 className="hcc-h1">
          Le style continue.<br />
          <span className="hcc-h1-dim">Les pièces aussi.</span>
        </h1>
        <p className="hcc-lead">
          Découvrez des pièces choisies auprès de boutiques tunisiennes vérifiées.
          Moins de gaspillage, plus de caractère.
        </p>
        <div className="hcc-actions">
          <Link href="/collection" className="hcc-btn-primary">
            Explorer la collection <ArrowRight size={15} />
          </Link>
          <Link href="/boutiques" className="hcc-btn-secondary">
            Rencontrer les boutiques
          </Link>
        </div>
        <div className="hcc-proof">
          <span><BadgeCheck size={13} /> Boutiques vérifiées</span>
          <span><Truck size={13} /> Achat serein · Livraison partout</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          BOTTOM BAR: left = category info · right = controls
      ════════════════════════════════════════════════════ */}
      <div className="hcc-bottom">

        {/* LEFT: active category name + discover link */}
        {cat && (
          <div className="hcc-info">
            <h2 className="hcc-cat-title" key={active}>{cat.name}</h2>
            {(cat.product_count ?? 0) > 0 && (
              <span className="hcc-count">
                {cat.product_count} pièce{cat.product_count! > 1 ? "s" : ""} disponible{cat.product_count! > 1 ? "s" : ""}
              </span>
            )}
            <Link
              href={`/collection?cat=${encodeURIComponent(cat.name)}`}
              className="hcc-link"
            >
              Découvrir cette sélection <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* RIGHT: arrows + pips + thumbnails */}
        <div className="hcc-right-controls">
          {/* Thumbnails strip */}
          <div className="hcc-thumbs">
            {categories.map((c, i) => (
              <button
                key={c.id ?? c.name}
                className={`hcc-thumb${i === active ? " hcc-thumb-active" : ""}`}
                onClick={() => setActive(i)}
                aria-label={c.name}
                title={c.name}
              >
                <img src={c.image || fallback} alt={c.name} />
                <span>{c.name}</span>
              </button>
            ))}
          </div>

          {/* Arrows + pip indicators */}
          <div className="hcc-controls">
            <button className="hcc-arrow" onClick={prev} aria-label="Précédent">‹</button>
            <div className="hcc-dots" role="tablist">
              {categories.map((c, i) => (
                <button
                  key={c.id ?? c.name}
                  role="tab"
                  aria-selected={i === active}
                  aria-label={c.name}
                  className={`hcc-pip${i === active ? " hcc-pip-active" : ""}`}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>
            <button className="hcc-arrow" onClick={next} aria-label="Suivant">›</button>
          </div>
        </div>

      </div>
    </div>
  );
}
