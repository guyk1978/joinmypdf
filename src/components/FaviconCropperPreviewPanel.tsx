"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  FAVICON_CROP_PREVIEW_SIZES,
  getFaviconCropPreviewDataUrls,
  squareCropToPixels,
  type FaviconCropPreviewSize,
} from "@/lib/favicon-cropper";
import type { NormalizedCropRect } from "@/lib/crop-pdf";

export type FaviconCropperPreviewPanelLabels = {
  title: string;
  hint: string;
  updating: string;
  formatSize: (size: number) => string;
};

type FaviconCropperPreviewPanelProps = {
  imageSrc: string;
  crop: NormalizedCropRect;
  naturalWidth: number;
  naturalHeight: number;
  labels: FaviconCropperPreviewPanelLabels;
};

const PREVIEW_DEBOUNCE_MS = 120;

export function FaviconCropperPreviewPanel({
  imageSrc,
  crop,
  naturalWidth,
  naturalHeight,
  labels,
}: FaviconCropperPreviewPanelProps) {
  const requestRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const [previews, setPreviews] = useState<Partial<Record<FaviconCropPreviewSize, string>>>({});
  const [updating, setUpdating] = useState(true);

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    setUpdating(true);
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    timerRef.current = window.setTimeout(() => {
      const pixelCrop = squareCropToPixels(crop, naturalWidth, naturalHeight);

      void getFaviconCropPreviewDataUrls(imageSrc, pixelCrop)
        .then((next) => {
          if (requestRef.current !== requestId) return;
          setPreviews(next);
        })
        .catch(() => {
          if (requestRef.current !== requestId) return;
          setPreviews({});
        })
        .finally(() => {
          if (requestRef.current !== requestId) return;
          setUpdating(false);
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [imageSrc, crop, naturalWidth, naturalHeight]);

  return (
    <section
      className="favicon-cropper-tool__preview-panel tool-workspace-panel"
      aria-labelledby="favicon-cropper-preview-heading"
    >
      <h3 id="favicon-cropper-preview-heading" className="favicon-cropper-tool__preview-title">
        {labels.title}
      </h3>
      <p className="favicon-cropper-tool__preview-hint">{labels.hint}</p>

      <div className="favicon-cropper-tool__preview-grid" role="list">
        {FAVICON_CROP_PREVIEW_SIZES.map((size) => (
          <div key={size} className="favicon-cropper-tool__preview-cell" role="listitem">
            <div
              className="favicon-cropper-tool__preview-frame"
              style={{ width: Math.max(size * 2, 48), height: Math.max(size * 2, 48) }}
            >
              {previews[size] ? (
                <img
                  src={previews[size]}
                  alt=""
                  className="favicon-cropper-tool__preview-img"
                  width={size}
                  height={size}
                  draggable={false}
                />
              ) : (
                <span className="favicon-cropper-tool__preview-placeholder" aria-hidden />
              )}
            </div>
            <span className="favicon-cropper-tool__preview-size">{labels.formatSize(size)}</span>
          </div>
        ))}
      </div>

      {updating ? (
        <p className="favicon-cropper-tool__preview-status" role="status" aria-live="polite">
          <Loader2 className="favicon-cropper-tool__preview-status-icon" strokeWidth={2} aria-hidden />
          <span>{labels.updating}</span>
        </p>
      ) : null}
    </section>
  );
}
