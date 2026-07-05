"use client";

import { useEffect, useRef } from "react";
import { createImage } from "@/lib/crop-image";
import { FAVICON_EXPORT_SIZES } from "@/lib/generate-favicon";
import { drawImageToSquareCanvas } from "@/lib/png-to-ico";

export type PngToIcoSizePreviewLabels = {
  title: string;
  hint: string;
  sizeLabel: (size: number) => string;
};

type PngToIcoSizePreviewProps = {
  imageSrc: string;
  naturalSize: { width: number; height: number };
  letterboxPadding: boolean;
  labels: PngToIcoSizePreviewLabels;
};

export function PngToIcoSizePreview({
  imageSrc,
  naturalSize,
  letterboxPadding,
  labels,
}: PngToIcoSizePreviewProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;

    let cancelled = false;
    void createImage(imageSrc).then((img) => {
      if (cancelled || !gridRef.current) return;

      for (const size of FAVICON_EXPORT_SIZES) {
        const canvas = gridRef.current.querySelector<HTMLCanvasElement>(
          `canvas[data-preview-size="${size}"]`,
        );
        if (!canvas) continue;

        const square = drawImageToSquareCanvas(img, size, { letterboxPadding });
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        canvas.width = size;
        canvas.height = size;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(square, 0, 0);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [imageSrc, naturalSize, letterboxPadding]);

  return (
    <section
      className="png-to-ico-tool__size-preview tool-workspace-panel"
      aria-labelledby="png-to-ico-size-preview-heading"
    >
      <h3 id="png-to-ico-size-preview-heading" className="png-to-ico-tool__size-preview-title">
        {labels.title}
      </h3>
      <p className="png-to-ico-tool__size-preview-hint">{labels.hint}</p>

      <div ref={gridRef} className="png-to-ico-tool__size-preview-grid">
        {FAVICON_EXPORT_SIZES.map((size) => (
          <div key={size} className="png-to-ico-tool__size-preview-cell">
            <p className="png-to-ico-tool__size-preview-label">{labels.sizeLabel(size)}</p>
            <div className="png-to-ico-tool__size-preview-canvas-wrap">
              <canvas
                data-preview-size={size}
                width={size}
                height={size}
                className={`png-to-ico-tool__size-preview-canvas png-to-ico-tool__size-preview-canvas--${size}`}
                aria-label={labels.sizeLabel(size)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
