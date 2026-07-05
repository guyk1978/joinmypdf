"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import {
  analyzeSvgFaviconContrast,
  formatContrastRatio,
  type SvgFaviconContrastResult,
} from "@/lib/svg-favicon-contrast";

export type SvgToFaviconContrastCheckerLabels = {
  contrastTitle: string;
  contrastHint: string;
  contrastChecking: string;
  contrastPass: (ratio: string) => string;
  contrastWarning: (ratio: string) => string;
  contrastInvalid: string;
};

type SvgToFaviconContrastCheckerProps = {
  imageSrc: string;
  labels: SvgToFaviconContrastCheckerLabels;
};

export function SvgToFaviconContrastChecker({
  imageSrc,
  labels,
}: SvgToFaviconContrastCheckerProps) {
  const [result, setResult] = useState<SvgFaviconContrastResult | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);

    void analyzeSvgFaviconContrast(imageSrc).then((analysis) => {
      if (cancelled) return;
      setResult(analysis);
      setChecking(false);
    });

    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  return (
    <section
      className="svg-to-favicon-tool__contrast tool-workspace-panel"
      aria-labelledby="svg-to-favicon-contrast-heading"
    >
      <h3 id="svg-to-favicon-contrast-heading" className="svg-to-favicon-tool__contrast-title">
        {labels.contrastTitle}
      </h3>
      <p className="svg-to-favicon-tool__contrast-hint">{labels.contrastHint}</p>

      {checking ? (
        <p className="generate-favicon-tool__contrast generate-favicon-tool__contrast--muted">
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin"
            strokeWidth={2}
            aria-hidden
          />
          <span>{labels.contrastChecking}</span>
        </p>
      ) : !result?.valid ? (
        <p className="generate-favicon-tool__contrast generate-favicon-tool__contrast--muted">
          {labels.contrastInvalid}
        </p>
      ) : result.passes ? (
        <p
          className="generate-favicon-tool__contrast generate-favicon-tool__contrast--pass"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          <span>{labels.contrastPass(formatContrastRatio(result.worstRatio))}</span>
        </p>
      ) : (
        <p
          className="generate-favicon-tool__contrast generate-favicon-tool__contrast--warn"
          role="status"
          aria-live="polite"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          <span>{labels.contrastWarning(formatContrastRatio(result.worstRatio))}</span>
        </p>
      )}
    </section>
  );
}
