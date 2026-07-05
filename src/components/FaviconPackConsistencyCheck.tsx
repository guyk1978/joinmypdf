"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  analyzeFaviconPackSourceQuality,
  formatFaviconPackUpscaleFactor,
} from "@/lib/favicon-pack";

export type FaviconPackConsistencyCheckLabels = {
  consistencyTitle: string;
  consistencyHint: string;
  consistencyPass: string;
  consistencyWarning: (upscale: string, shortSide: number, recommended: number) => string;
};

type FaviconPackConsistencyCheckProps = {
  width: number;
  height: number;
  labels: FaviconPackConsistencyCheckLabels;
};

export function FaviconPackConsistencyCheck({
  width,
  height,
  labels,
}: FaviconPackConsistencyCheckProps) {
  const analysis = analyzeFaviconPackSourceQuality(width, height);

  return (
    <section
      className="favicon-pack-tool__consistency tool-workspace-panel"
      aria-labelledby="favicon-pack-consistency-heading"
    >
      <h3 id="favicon-pack-consistency-heading" className="favicon-pack-tool__consistency-title">
        {labels.consistencyTitle}
      </h3>
      <p className="favicon-pack-tool__consistency-hint">{labels.consistencyHint}</p>

      {analysis.needsWarning ? (
        <p
          className="favicon-pack-tool__consistency-status favicon-pack-tool__consistency-status--warn"
          role="status"
          aria-live="polite"
        >
          <AlertTriangle className="favicon-pack-tool__consistency-icon" strokeWidth={2} aria-hidden />
          <span>
            {labels.consistencyWarning(
              formatFaviconPackUpscaleFactor(analysis.upscaleFactor),
              analysis.shortSide,
              analysis.recommendedMinPx,
            )}
          </span>
        </p>
      ) : (
        <p
          className="favicon-pack-tool__consistency-status favicon-pack-tool__consistency-status--pass"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="favicon-pack-tool__consistency-icon" strokeWidth={2} aria-hidden />
          <span>{labels.consistencyPass}</span>
        </p>
      )}
    </section>
  );
}
