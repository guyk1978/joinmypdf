"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import {
  analyzeAppleTouchIconSourceQuality,
  APPLE_TOUCH_ICON_RETINA_SIZE,
  formatAppleTouchUpscaleFactor,
} from "@/lib/apple-touch-icon";

export type AppleTouchIconRetinaQualityLabels = {
  retinaTitle: string;
  retinaHint: string;
  retinaPass: (supersample: number) => string;
  retinaWarning: (upscale: string, shortSide: number, recommended: number) => string;
};

type AppleTouchIconRetinaQualityProps = {
  width: number;
  height: number;
  labels: AppleTouchIconRetinaQualityLabels;
};

export function AppleTouchIconRetinaQuality({
  width,
  height,
  labels,
}: AppleTouchIconRetinaQualityProps) {
  const analysis = analyzeAppleTouchIconSourceQuality(width, height, APPLE_TOUCH_ICON_RETINA_SIZE);

  return (
    <section
      className="apple-touch-icon-tool__retina-quality tool-workspace-panel"
      aria-labelledby="apple-touch-retina-heading"
    >
      <h3 id="apple-touch-retina-heading" className="apple-touch-icon-tool__retina-title">
        {labels.retinaTitle}
      </h3>
      <p className="apple-touch-icon-tool__retina-hint">{labels.retinaHint}</p>

      {analysis.needsWarning ? (
        <p
          className="apple-touch-icon-tool__retina-status apple-touch-icon-tool__retina-status--warn"
          role="status"
          aria-live="polite"
        >
          <AlertTriangle className="apple-touch-icon-tool__retina-icon" strokeWidth={2} aria-hidden />
          <span>
            {labels.retinaWarning(
              formatAppleTouchUpscaleFactor(analysis.upscaleFactor),
              analysis.shortSide,
              analysis.recommendedMinPx,
            )}
          </span>
        </p>
      ) : (
        <p
          className="apple-touch-icon-tool__retina-status apple-touch-icon-tool__retina-status--pass"
          role="status"
          aria-live="polite"
        >
          <Sparkles className="apple-touch-icon-tool__retina-icon" strokeWidth={2} aria-hidden />
          <span>{labels.retinaPass(analysis.supersampleFactor)}</span>
        </p>
      )}
    </section>
  );
}
