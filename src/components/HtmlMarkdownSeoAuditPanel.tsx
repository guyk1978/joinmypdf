"use client";

import { clsx } from "clsx";
import type { SeoAuditFinding, SeoAuditSeverity } from "@/lib/html-markdown-seo-audit";

export type HtmlMarkdownSeoAuditLabels = {
  seoAuditTitle: string;
  seoAuditHint: string;
  seoNoHtml: string;
  seoH1Missing: string;
  seoH1Multiple: string;
  seoHeadingSkip: string;
  seoTooManyHeadings: string;
  seoImgMissingAlt: string;
  seoLongParagraph: string;
  seoStructureGood: string;
};

type HtmlMarkdownSeoAuditPanelProps = {
  findings: SeoAuditFinding[];
  labels: HtmlMarkdownSeoAuditLabels;
  className?: string;
};

function severityLabel(severity: SeoAuditSeverity): string {
  if (severity === "good") return "Good";
  if (severity === "warning") return "Warning";
  return "Fix";
}

function formatMessage(labels: HtmlMarkdownSeoAuditLabels, finding: SeoAuditFinding): string {
  const base = labels[finding.messageKey as keyof HtmlMarkdownSeoAuditLabels];
  if (typeof base !== "string") return finding.messageKey;
  if (!finding.detail) return base;
  return base.replace("{detail}", finding.detail);
}

export function HtmlMarkdownSeoAuditPanel({
  findings,
  labels,
  className,
}: HtmlMarkdownSeoAuditPanelProps) {
  return (
    <aside
      className={clsx("html-md-converter-tool__seo-audit tool-workspace-panel", className)}
      aria-label={labels.seoAuditTitle}
    >
      <div className="html-md-converter-tool__seo-audit-header">
        <h3 className="html-md-converter-tool__seo-audit-title">{labels.seoAuditTitle}</h3>
        <p className="html-md-converter-tool__seo-audit-hint">{labels.seoAuditHint}</p>
      </div>
      <ul className="html-md-converter-tool__seo-audit-list">
        {findings.map((finding) => (
          <li
            key={finding.id}
            className={clsx(
              "html-md-converter-tool__seo-audit-item",
              `html-md-converter-tool__seo-audit-item--${finding.severity}`,
            )}
          >
            <span
              className="html-md-converter-tool__seo-audit-dot"
              aria-hidden
              title={severityLabel(finding.severity)}
            />
            <span>{formatMessage(labels, finding)}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
