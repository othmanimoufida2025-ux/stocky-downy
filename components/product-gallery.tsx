"use client";

import { useState } from "react";

type Props = {
  images: string[];
  title: string;
  fallback?: string;
};

export function ProductGallery({ images, title, fallback = "/demo-fashion.svg" }: Props) {
  const validImages = Array.isArray(images) && images.length > 0 ? images : [fallback];
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeSrc = validImages[selectedIndex] || validImages[0] || fallback;

  return (
    <div className="gallery" role="region" aria-label="Galerie photos du produit">
      <div className="gallery-main" style={{ position: "relative", overflow: "hidden" }}>
        <img
          src={activeSrc}
          alt={`${title} - Photo ${selectedIndex + 1}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {validImages.length > 1 && (
          <span
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              background: "rgba(35, 17, 26, 0.75)",
              color: "#fff",
              fontSize: "0.75rem",
              padding: "4px 8px",
              borderRadius: "4px",
              letterSpacing: "0.05em",
              backdropFilter: "blur(4px)",
            }}
          >
            {selectedIndex + 1} / {validImages.length}
          </span>
        )}
      </div>

      {validImages.length > 1 && (
        <div
          className="gallery-thumbs"
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "12px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
          {validImages.map((src, idx) => {
            const isActive = idx === selectedIndex;
            return (
              <button
                type="button"
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`gallery-thumb ${isActive ? "active" : ""}`}
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  border: isActive ? "2px solid var(--sd-wine, #5c1d38)" : "1px solid var(--sd-line, #e2d9dc)",
                  opacity: isActive ? 1 : 0.65,
                  padding: 0,
                  cursor: "pointer",
                  flexShrink: 0,
                  background: "#f9f6f7",
                  transition: "all 0.15s ease",
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
