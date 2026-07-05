"use client";

import { CheckCircle2, Gauge, MinusCircle } from "lucide-react";
import {
  analyzeFaviconCompressionSavings,
  formatBytes,
} from "@/lib/favicon-compressor";

export type FaviconCompressorSavingsCalculatorLabels = {
  title: string;
  hint: string;
  calculating: string;
  compressedBy: (percent: number) => string;
  savedAmount: (saved: string, bytes: number) => string;
  alreadyOptimal: string;
  noSavingsYet: string;
};

type FaviconCompressorSavingsCalculatorProps = {
  originalBytes: number;
  compressedBytes: number | null;
  estimating: boolean;
  labels: FaviconCompressorSavingsCalculatorLabels;
};

export function FaviconCompressorSavingsCalculator({
  originalBytes,
  compressedBytes,
  estimating,
  labels,
}: FaviconCompressorSavingsCalculatorProps) {
  const analysis =
    compressedBytes !== null
      ? analyzeFaviconCompressionSavings(originalBytes, compressedBytes)
      : null;

  return (
    <section
      className="favicon-compressor-tool__savings tool-workspace-panel"
      aria-labelledby="favicon-compressor-savings-heading"
    >
      <h3 id="favicon-compressor-savings-heading" className="favicon-compressor-tool__savings-title">
        {labels.title}
      </h3>
      <p className="favicon-compressor-tool__savings-hint">{labels.hint}</p>

      {estimating ? (
        <p
          className="favicon-compressor-tool__savings-status favicon-compressor-tool__savings-status--pending"
          role="status"
          aria-live="polite"
        >
          <Gauge className="favicon-compressor-tool__savings-icon" strokeWidth={2} aria-hidden />
          <span>{labels.calculating}</span>
        </p>
      ) : analysis?.hasSavings ? (
        <div
          className="favicon-compressor-tool__savings-result favicon-compressor-tool__savings-result--pass"
          role="status"
          aria-live="polite"
        >
          <p className="favicon-compressor-tool__savings-headline">
            <CheckCircle2 className="favicon-compressor-tool__savings-icon" strokeWidth={2} aria-hidden />
            <span>{labels.compressedBy(analysis.savingsPercent)}</span>
          </p>
          <p className="favicon-compressor-tool__savings-detail">
            {labels.savedAmount(formatBytes(analysis.savedBytes), analysis.savedBytes)}
          </p>
        </div>
      ) : analysis?.alreadyOptimal ? (
        <p
          className="favicon-compressor-tool__savings-status favicon-compressor-tool__savings-status--neutral"
          role="status"
          aria-live="polite"
        >
          <MinusCircle className="favicon-compressor-tool__savings-icon" strokeWidth={2} aria-hidden />
          <span>{labels.alreadyOptimal}</span>
        </p>
      ) : (
        <p
          className="favicon-compressor-tool__savings-status favicon-compressor-tool__savings-status--pending"
          role="status"
          aria-live="polite"
        >
          <Gauge className="favicon-compressor-tool__savings-icon" strokeWidth={2} aria-hidden />
          <span>{labels.noSavingsYet}</span>
        </p>
      )}
    </section>
  );
}
