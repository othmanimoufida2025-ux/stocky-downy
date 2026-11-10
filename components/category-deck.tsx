"use client";

import { useState, useRef, useCallback, useEffect, PointerEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Category = {
  id?: string | number;
  name: string;
  image?: string;
  product_count?: number;
};

type Props = {
  categories: Category[];
};

const FALLBACK = "/demo-fashion.svg";

/** Deck layout offsets for each card below the top (index 0 = top card). */
const OFFSETS = [
  { x:  0,   y:  0,  rot: 0,    scale: 1     },
  { x:  7,   y:  5,  rot:  2.5, scale: 0.97  },
  { x: 13,   y:  9,  rot:  4.8, scale: 0.944 },
  { x: 18,   y: 12,  rot:  6.8, scale: 0.918 },
  { x: 22,   y: 14,  rot:  8.5, scale: 0.895 },
];

export function CategoryDeck({ categories }: Props) {
  // order[0] is always the index of the card currently on top
  const [order, setOrder] = useState<number[]>(() => categories.map((_, i) => i));
  // drag state for the top card
  const dragRef    = useRef<{ startX: number; startY: number; lastX: number; active: boolean }>({
    startX: 0, startY: 0, lastX: 0, active: false,
  });
  const topCardRef = useRef<HTMLDivElement>(null);
  const deckRef    = useRef<HTMLDivElement>(null);
  const [drag, setDrag]   = useState({ dx: 0, rot: 0, scale: 1, throwing: false });
  const [thrown, setThrown] = useState(false); // gate to prevent double-throw

  const count = categories.length;

  const throwCard = useCallback((direction: "left" | "right") => {
    if (thrown) return;
    setThrown(true);
    const sign = direction === "right" ? 1 : -1;
    const deckW = deckRef.current?.offsetWidth ?? 400;
    setDrag({ dx: sign * deckW * 1.15, rot: sign * 28, scale: 1.04, throwing: true });
    setTimeout(() => {
      setOrder(prev => {
        const next = [...prev];
        next.push(next.shift()!);
        return next;
      });
      setDrag({ dx: 0, rot: 0, scale: 1, throwing: false });
      setThrown(false);
    }, 400);
  }, [thrown]);

  /* ── Pointer handlers ─────────────────────────── */
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (thrown) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, lastX: e.clientX, active: true };
    setDrag(d => ({ ...d, throwing: false }));
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active || thrown) return;
    const dx = e.clientX - dragRef.current.startX;
    dragRef.current.lastX = e.clientX;
    setDrag({ dx, rot: dx * 0.06, scale: 1.015, throwing: false });
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const deckW = deckRef.current?.offsetWidth ?? 400;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > deckW * 0.1) {
      throwCard(dx > 0 ? "right" : "left");
    } else {
      setDrag({ dx: 0, rot: 0, scale: 1, throwing: true });
      setTimeout(() => setDrag(d => ({ ...d, throwing: false })), 300);
    }
  }

  /* ── Keyboard handler ─────────────────────────── */
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft")  { e.preventDefault(); throwCard("left"); }
    if (e.key === "ArrowRight") { e.preventDefault(); throwCard("right"); }
  }

  if (!categories.length) return null;

  const topIdx    = order[0];
  const activeCat = categories[topIdx];

  return (
    <section className="cdk-section" aria-label="Catégories">
      {/* ── Accent dots ─────────────────────────── */}
      <span className="cdk-dot cdk-dot-amber" aria-hidden="true" />
      <span className="cdk-dot cdk-dot-teal"  aria-hidden="true" />

      <div className="cdk-inner">
        {/* ── Left: info panel ─────────────────── */}
        <div className="cdk-info">
          <span className="cdk-eyebrow">Choisir autrement</span>
          <h2 className="cdk-heading" key={topIdx}>{activeCat.name}</h2>
          {(activeCat.product_count ?? 0) > 0 && (
            <p className="cdk-count">
              <span className="cdk-count-num">{activeCat.product_count}</span>
              &nbsp;pièce{activeCat.product_count! > 1 ? "s" : ""} disponible{activeCat.product_count! > 1 ? "s" : ""}
            </p>
          )}
          <Link
            href={`/collection?cat=${encodeURIComponent(activeCat.name)}`}
            className="cdk-link"
          >
            Voir la sélection <ArrowRight size={14} />
          </Link>

          {/* pip indicators */}
          <div className="cdk-pips" role="tablist" aria-label="Catégories">
            {categories.map((c, i) => (
              <button
                key={c.id ?? c.name}
                role="tab"
                aria-selected={order[0] === i}
                aria-label={c.name}
                className={`cdk-pip${order[0] === i ? " cdk-pip-active" : ""}`}
                onClick={() => {
                  // Rotate order so i becomes first
                  setOrder(prev => {
                    const idx = prev.indexOf(i);
                    return [...prev.slice(idx), ...prev.slice(0, idx)];
                  });
                }}
              />
            ))}
          </div>

          {/* arrow controls */}
          <div className="cdk-arrows">
            <button className="cdk-arrow" onClick={() => throwCard("left")}  aria-label="Précédent">‹</button>
            <button className="cdk-arrow" onClick={() => throwCard("right")} aria-label="Suivant">›</button>
          </div>
        </div>

        {/* ── Right: throwable deck ─────────────── */}
        <div
          className="cdk-deck"
          ref={deckRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          aria-label={`Carte de catégorie : ${activeCat.name}. Utilisez ← → pour naviguer.`}
        >
          {/* Render cards bottom-to-top so top card is last in DOM (highest z) */}
          {[...order].reverse().map((catIdx, revI) => {
            const stackPos = order.length - 1 - revI; // 0 = top
            const isTop    = stackPos === 0;
            const off      = OFFSETS[Math.min(stackPos, OFFSETS.length - 1)];
            const cat      = categories[catIdx];

            const baseTransform = `translate(${off.x}px, ${off.y}px) rotate(${off.rot}deg) scale(${off.scale})`;
            const topTransform  = `translate(${drag.dx + off.x}px, ${off.y - (isTop && drag.scale > 1 ? 6 : 0)}px) rotate(${drag.rot + off.rot}deg) scale(${drag.scale})`;

            return (
              <div
                key={cat.id ?? cat.name}
                ref={isTop ? topCardRef : undefined}
                className={`cdk-card${isTop ? " cdk-card-top" : ""}`}
                style={{
                  transform: isTop ? topTransform : baseTransform,
                  transition: isTop
                    ? drag.throwing
                      ? "transform 0.38s cubic-bezier(.22,1,.36,1)"
                      : dragRef.current.active
                        ? "none"
                        : "transform 0.3s cubic-bezier(.22,1,.36,1)"
                    : "transform 0.4s cubic-bezier(.22,1,.36,1)",
                  zIndex: order.length - stackPos,
                  cursor: isTop ? (dragRef.current.active ? "grabbing" : "grab") : "default",
                  pointerEvents: isTop ? "auto" : "none",
                }}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop   ? onPointerUp   : undefined}
              >
                <img
                  src={cat.image || FALLBACK}
                  alt={cat.name}
                  draggable={false}
                  className="cdk-card-img"
                />
                {/* card footer */}
                <div className="cdk-card-label">
                  <span className="cdk-card-name">{cat.name}</span>
                  {(cat.product_count ?? 0) > 0 && (
                    <span className="cdk-card-badge">{cat.product_count}</span>
                  )}
                </div>
                {/* hint rule (only on top card) */}
                {isTop && <span className="cdk-card-hint" aria-hidden="true" />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
