"use client";

import { CheckCircle2, FileSearch, MinusCircle } from "lucide-react";
import { formatBytes } from "@/lib/favicon-compressor";
import type { FaviconMetadataReport } from "@/lib/favicon-compressor-metadata";

export type FaviconCompressorMetadataReportLabels = {
  title: string;
  hint: string;
  scanning: string;
  removedPrefix: string;
  removedItem: (item: string) => string;
  totalRemoved: (bytes: string) => string;
  noMetadata: string;
  awaitingCompression: string;
  categories: {
    exif: string;
    "icc-profile": string;
    xmp: string;
    photoshop: string;
    "png-text": string;
    "png-time": string;
    comment: string;
    thumbnail: string;
  };
};

type FaviconCompressorMetadataReportProps = {
  report: FaviconMetadataReport | null;
  estimating: boolean;
  ready: boolean;
  labels: FaviconCompressorMetadataReportLabels;
};

export function FaviconCompressorMetadataReport({
  report,
  estimating,
  ready,
  labels,
}: FaviconCompressorMetadataReportProps) {
  return (
    <section
      className="favicon-compressor-tool__metadata tool-workspace-panel"
      aria-labelledby="favicon-compressor-metadata-heading"
    >
      <h3 id="favicon-compressor-metadata-heading" className="favicon-compressor-tool__metadata-title">
        {labels.title}
      </h3>
      <p className="favicon-compressor-tool__metadata-hint">{labels.hint}</p>

      {estimating ? (
        <p
          className="favicon-compressor-tool__metadata-status favicon-compressor-tool__metadata-status--pending"
          role="status"
          aria-live="polite"
        >
          <FileSearch className="favicon-compressor-tool__metadata-icon" strokeWidth={2} aria-hidden />
          <span>{labels.scanning}</span>
        </p>
      ) : !ready ? (
        <p
          className="favicon-compressor-tool__metadata-status favicon-compressor-tool__metadata-status--pending"
          role="status"
          aria-live="polite"
        >
          <FileSearch className="favicon-compressor-tool__metadata-icon" strokeWidth={2} aria-hidden />
          <span>{labels.awaitingCompression}</span>
        </p>
      ) : report?.hasMetadata ? (
        <div
          className="favicon-compressor-tool__metadata-result favicon-compressor-tool__metadata-result--pass"
          role="status"
          aria-live="polite"
        >
          <p className="favicon-compressor-tool__metadata-headline">
            <CheckCircle2 className="favicon-compressor-tool__metadata-icon" strokeWidth={2} aria-hidden />
            <span>{labels.removedPrefix}</span>
          </p>
          <ul className="favicon-compressor-tool__metadata-list">
            {report.findings.map((finding) => (
              <li key={finding.id} className="favicon-compressor-tool__metadata-item">
                {labels.removedItem(labels.categories[finding.id])}
              </li>
            ))}
          </ul>
          <p className="favicon-compressor-tool__metadata-total">
            {labels.totalRemoved(formatBytes(report.totalMetadataBytes))}
          </p>
        </div>
      ) : (
        <p
          className="favicon-compressor-tool__metadata-status favicon-compressor-tool__metadata-status--neutral"
          role="status"
          aria-live="polite"
        >
          <MinusCircle className="favicon-compressor-tool__metadata-icon" strokeWidth={2} aria-hidden />
          <span>{labels.noMetadata}</span>
        </p>
      )}
    </section>
  );
}
