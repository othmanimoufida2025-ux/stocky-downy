"use client";

import { useState, useEffect, useRef, TouchEvent } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import type { StorefrontProduct } from "@/lib/storefront";

import { money } from "@/lib/utils";
export { money };

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const fallback = product.category === "Accessoires" ? "/demo-bag.svg" : "/demo-fashion.svg";
  const images = (product.images && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : [fallback]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Touch swipe support for mobile
  const touchStartX = useRef<number | null>(null);

  // Auto-change images every 3 seconds
  useEffect(() => {
    if (images.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % images.length);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;
      if (diff > 35) {
        // Swiped left
        setActiveIdx((prev) => (prev + 1) % images.length);
      } else if (diff < -35) {
        // Swiped right
        setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    touchStartX.current = null;
  };

  const activeSrc = images[activeIdx] || images[0] || fallback;

  return (
    <article
      className="sf-product"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="sf-product-image"
        style={{ position: "relative", overflow: "hidden" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Link href={`/produit/${product.slug}`} style={{ display: "block", width: "100%", height: "100%" }}>
          <img
            key={activeSrc}
            src={activeSrc}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.2s ease" }}
          />
        </Link>

        {/* NAVIGATION CONTROLS (IF MULTIPLE IMAGES) */}
        {images.length > 1 && (
          <>
            {/* LEFT / RIGHT BUTTONS */}
            <button
              type="button"
              onClick={prevImage}
              aria-label="Photo précédente"
              style={{
                position: "absolute",
                left: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(4px)",
                border: "none",
                color: "#211918",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                zIndex: 2,
                opacity: isHovered ? 1 : 0.8,
                transition: "opacity 0.15s ease",
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={nextImage}
              aria-label="Photo suivante"
              style={{
                position: "absolute",
                right: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(4px)",
                border: "none",
                color: "#211918",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                zIndex: 2,
                opacity: isHovered ? 1 : 0.8,
                transition: "opacity 0.15s ease",
              }}
            >
              <ChevronRight size={16} />
            </button>

            {/* DOT INDICATORS */}
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "4px",
                padding: "2px 6px",
                borderRadius: "999px",
                background: "rgba(0,0,0,0.3)",
                backdropFilter: "blur(3px)",
                zIndex: 2,
              }}
            >
              {images.map((_, i) => (
                <span
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveIdx(i);
                  }}
                  style={{
                    width: i === activeIdx ? "12px" : "5px",
                    height: "5px",
                    borderRadius: "999px",
                    background: i === activeIdx ? "#fff" : "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "inline-block",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="sf-product-body">
        <Link href={`/boutique/${product.store_slug}`} className="sf-shop-name">
          {product.store}
          <BadgeCheck />
        </Link>
        <Link href={`/produit/${product.slug}`}>
          <h2>{product.name}</h2>
        </Link>
        <div className="sf-product-meta">
          <strong>{money(product.price)}</strong>
          <span>{product.condition || "Très bon état"}</span>
        </div>
        <AddToCart id={product.id} stock={Number(product.stock)} compact />
      </div>
    </article>
  );
}
