"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  contrastRatio,
  FAVICON_WCAG_AA_RATIO,
  parseHexColor,
} from "@/lib/favicon-brand-harmony";

export type GenerateFaviconContrastCheckerLabels = {
  contrastLabel: string;
  contrastPass: (ratio: string) => string;
  contrastWarning: (ratio: string) => string;
  contrastInvalid: string;
};

type GenerateFaviconContrastCheckerProps = {
  backgroundColor: string;
  textColor: string;
  labels: GenerateFaviconContrastCheckerLabels;
};

function formatContrastRatio(ratio: number): string {
  return ratio >= 10 ? ratio.toFixed(1) : ratio.toFixed(2);
}

export function GenerateFaviconContrastChecker({
  backgroundColor,
  textColor,
  labels,
}: GenerateFaviconContrastCheckerProps) {
  const { ratio, valid, passes } = useMemo(() => {
    const bg = parseHexColor(backgroundColor);
    const fg = parseHexColor(textColor);
    if (!bg || !fg) {
      return { ratio: 0, valid: false, passes: false };
    }
    const value = contrastRatio(textColor, backgroundColor);
    return {
      ratio: value,
      valid: true,
      passes: value >= FAVICON_WCAG_AA_RATIO,
    };
  }, [backgroundColor, textColor]);

  if (!valid) {
    return (
      <p className="generate-favicon-tool__contrast generate-favicon-tool__contrast--muted">
        {labels.contrastInvalid}
      </p>
    );
  }

  const ratioLabel = formatContrastRatio(ratio);

  if (passes) {
    return (
      <p
        className="generate-favicon-tool__contrast generate-favicon-tool__contrast--pass"
        role="status"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        <span>{labels.contrastPass(ratioLabel)}</span>
      </p>
    );
  }

  return (
    <p
      className="generate-favicon-tool__contrast generate-favicon-tool__contrast--warn"
      role="status"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
      <span>{labels.contrastWarning(ratioLabel)}</span>
    </p>
  );
}
