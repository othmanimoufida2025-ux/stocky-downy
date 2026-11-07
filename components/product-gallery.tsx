"use client";

import { useState, useEffect, useRef, useCallback, TouchEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: string[];
  title: string;
  fallback?: string;
  autoPlayInterval?: number; // in milliseconds, defaults to 3000 (3 seconds)
};

export function ProductGallery({
  images,
  title,
  fallback = "/demo-fashion.svg",
  autoPlayInterval = 3000,
}: Props) {
  const validImages = Array.isArray(images) && images.length > 0 ? images : [fallback];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Swipe state for mobile navigation
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Navigation handlers
  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  const selectPhoto = (index: number) => {
    setSelectedIndex(index);
    // Restart pause momentarily so user can view chosen photo
    setIsPaused(true);
    const timer = setTimeout(() => setIsPaused(false), 4000);
    return () => clearTimeout(timer);
  };

  // Auto-play slideshow every 3 seconds (when not paused and more than 1 image)
  useEffect(() => {
    if (validImages.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [validImages.length, isPaused, autoPlayInterval, goToNext]);

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext]);

  // Touch event handlers for mobile swipe
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
    setIsPaused(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      const threshold = 40; // minimum distance to trigger swipe

      if (diff > threshold) {
        // Swiped left -> next photo
        goToNext();
      } else if (diff < -threshold) {
        // Swiped right -> previous photo
        goToPrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
    // Resume auto-advance after swipe
    setTimeout(() => setIsPaused(false), 2000);
  };

  const activeSrc = validImages[selectedIndex] || validImages[0] || fallback;

  return (
    <div
      className="gallery"
      role="region"
      aria-label="Galerie photos du produit"
      style={{ display: "flex", flexDirection: "column" }}
    >
      {/* MAIN IMAGE CONTAINER */}
      <div
        className="gallery-main"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "14px",
          backgroundColor: "#f5f0ed",
          userSelect: "none",
          touchAction: "pan-y",
        }}
      >
        <img
          key={activeSrc}
          src={activeSrc}
          alt={`${title} - Vue ${selectedIndex + 1}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "opacity 0.25s ease-in-out",
          }}
        />

        {/* NAVIGATION ARROWS (WEB & MOBILE) */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              aria-label="Photo précédente"
              style={{
                position: "absolute",
                top: "50%",
                left: "12px",
                transform: "translateY(-50%)",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                color: "#3a1919",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                zIndex: 3,
                transition: "all 0.15s ease",
              }}
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Photo suivante"
              style={{
                position: "absolute",
                top: "50%",
                right: "12px",
                transform: "translateY(-50%)",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                color: "#3a1919",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                zIndex: 3,
                transition: "all 0.15s ease",
              }}
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* PHOTO COUNTER BADGE */}
        {validImages.length > 1 && (
          <span
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              background: "rgba(35, 17, 26, 0.78)",
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "4px 9px",
              borderRadius: "999px",
              letterSpacing: "0.05em",
              backdropFilter: "blur(6px)",
              zIndex: 2,
            }}
          >
            {selectedIndex + 1} / {validImages.length}
          </span>
        )}

        {/* DOT INDICATORS (FOR QUICK MOBILE & WEB NAVIGATION) */}
        {validImages.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "6px",
              padding: "4px 8px",
              borderRadius: "999px",
              background: "rgba(0, 0, 0, 0.28)",
              backdropFilter: "blur(4px)",
              zIndex: 2,
            }}
          >
            {validImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectPhoto(idx)}
                aria-label={`Aller à la photo ${idx + 1}`}
                style={{
                  width: idx === selectedIndex ? "18px" : "6px",
                  height: "6px",
                  borderRadius: "999px",
                  background: idx === selectedIndex ? "#fff" : "rgba(255, 255, 255, 0.55)",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* THUMBNAILS ROW */}
      {validImages.length > 1 && (
        <div
          className="gallery-thumbs"
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "12px",
            overflowX: "auto",
            paddingBottom: "4px",
            scrollbarWidth: "thin",
          }}
        >
          {validImages.map((src, idx) => {
            const isActive = idx === selectedIndex;
            return (
              <button
                type="button"
                key={idx}
                onClick={() => selectPhoto(idx)}
                className={`gallery-thumb ${isActive ? "active" : ""}`}
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: isActive
                    ? "2px solid var(--sd-wine, #5c1d38)"
                    : "1px solid var(--sd-line, #e2d9dc)",
                  opacity: isActive ? 1 : 0.6,
                  padding: 0,
                  cursor: "pointer",
                  flexShrink: 0,
                  background: "#f9f6f7",
                  transition: "all 0.15s ease",
                  transform: isActive ? "scale(1.02)" : "scale(1)",
                }}
                aria-label={`Afficher la photo ${idx + 1}`}
                aria-pressed={isActive}
              >
                <img
                  src={src}
                  alt={`Vignette ${idx + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
