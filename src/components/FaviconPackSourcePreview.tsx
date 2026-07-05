"use client";

import { useEffect, useRef } from "react";
import { createImage } from "@/lib/crop-image";
import { drawFaviconPackIconCanvas, FAVICON_PACK_PREVIEW_SIZE } from "@/lib/favicon-pack";

type FaviconPackSourcePreviewProps = {
  imageSrc: string;
  onDimensions: (width: number, height: number) => void;
};

export function FaviconPackSourcePreview({
  imageSrc,
  onDimensions,
}: FaviconPackSourcePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;

    void createImage(imageSrc).then((image) => {
      if (cancelled) return;

      onDimensions(image.naturalWidth, image.naturalHeight);

      const square = drawFaviconPackIconCanvas(image, FAVICON_PACK_PREVIEW_SIZE);
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = FAVICON_PACK_PREVIEW_SIZE;
      canvas.height = FAVICON_PACK_PREVIEW_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, FAVICON_PACK_PREVIEW_SIZE, FAVICON_PACK_PREVIEW_SIZE);
      ctx.drawImage(square, 0, 0);
    });

    return () => {
      cancelled = true;
    };
  }, [imageSrc, onDimensions]);

  return (
    <canvas
      ref={canvasRef}
      width={FAVICON_PACK_PREVIEW_SIZE}
      height={FAVICON_PACK_PREVIEW_SIZE}
      className="favicon-pack-tool__source-preview-canvas"
      aria-hidden
    />
  );
}
