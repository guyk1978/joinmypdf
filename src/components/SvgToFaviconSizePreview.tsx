"use client";

import { useEffect, useRef } from "react";
import { createImage } from "@/lib/crop-image";
import { drawSvgToSquareCanvas } from "@/lib/svg-to-favicon";

export type SvgToFaviconSizePreviewLabels = {
  title: string;
  hint: string;
  sizeLabel: (size: number) => string;
  smartScalingActive: string;
};

type SvgToFaviconSizePreviewProps = {
  imageSrc: string;
  sizes: number[];
  labels: SvgToFaviconSizePreviewLabels;
};

export function SvgToFaviconSizePreview({
  imageSrc,
  sizes,
  labels,
}: SvgToFaviconSizePreviewProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current || !sizes.length) return;

    let cancelled = false;
    void createImage(imageSrc).then((img) => {
      if (cancelled || !gridRef.current) return;

      for (const size of sizes) {
        const canvas = gridRef.current.querySelector<HTMLCanvasElement>(
          `canvas[data-preview-size="${size}"]`,
        );
        if (!canvas) continue;

        const square = drawSvgToSquareCanvas(img, size);
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
  }, [imageSrc, sizes]);

  return (
    <section
      className="svg-to-favicon-tool__size-preview tool-workspace-panel"
      aria-labelledby="svg-to-favicon-size-preview-heading"
    >
      <h3 id="svg-to-favicon-size-preview-heading" className="svg-to-favicon-tool__size-preview-title">
        {labels.title}
      </h3>
      <p className="svg-to-favicon-tool__size-preview-hint">{labels.hint}</p>
      <p className="svg-to-favicon-tool__smart-scaling-badge">{labels.smartScalingActive}</p>

      <div ref={gridRef} className="svg-to-favicon-tool__size-preview-grid">
        {sizes.map((size) => (
          <div key={size} className="svg-to-favicon-tool__size-preview-cell">
            <p className="svg-to-favicon-tool__size-preview-label">{labels.sizeLabel(size)}</p>
            <div className="svg-to-favicon-tool__size-preview-canvas-wrap">
              <canvas
                data-preview-size={size}
                width={size}
                height={size}
                className={`svg-to-favicon-tool__size-preview-canvas svg-to-favicon-tool__size-preview-canvas--${size}`}
                aria-label={labels.sizeLabel(size)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
