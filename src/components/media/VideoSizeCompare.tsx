"use client";

import { clsx } from "clsx";
import { formatBytes } from "@/lib/pdf-engine";

export type VideoSizeCompareLabels = {
  originalSize: string;
  compressedSize: string;
  pendingSize: string;
  formatSavings: (percent: number) => string;
  bytesSaved: (saved: string, bytes: number) => string;
};

type VideoSizeCompareProps = {
  originalBytes: number;
  compressedBytes: number | null;
  labels: VideoSizeCompareLabels;
  className?: string;
};

export function VideoSizeCompare({
  originalBytes,
  compressedBytes,
  labels,
  className,
}: VideoSizeCompareProps) {
  const savingsPercent =
    compressedBytes !== null ? Math.max(0, Math.round(((originalBytes - compressedBytes) / originalBytes) * 100)) : 0;
  const savedBytes =
    compressedBytes !== null ? Math.max(0, originalBytes - compressedBytes) : 0;

  return (
    <div className={clsx("video-size-compare", className)}>
      <div className="video-size-compare__cards crop-image-tool__size-compare">
        <div className="crop-image-tool__size-card">
          <span className="crop-image-tool__size-label">{labels.originalSize}</span>
          <span className="crop-image-tool__size-value">{formatBytes(originalBytes)}</span>
        </div>
        <div className="crop-image-tool__size-card crop-image-tool__size-card--compressed">
          <span className="crop-image-tool__size-label">{labels.compressedSize}</span>
          <span className="crop-image-tool__size-value">
            {compressedBytes !== null ? formatBytes(compressedBytes) : labels.pendingSize}
          </span>
          {compressedBytes !== null && savingsPercent > 0 ? (
            <span className="crop-image-tool__size-savings">{labels.formatSavings(savingsPercent)}</span>
          ) : null}
        </div>
      </div>

      {compressedBytes !== null && savedBytes > 0 ? (
        <p className="video-size-compare__bytes-saved" role="status">
          {labels.bytesSaved(formatBytes(savedBytes), savedBytes)}
        </p>
      ) : null}
    </div>
  );
}
