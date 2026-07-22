"use client";

import type { ReactNode } from "react";

type IntroPdfMockupProps = {
  title: string;
  badge?: ReactNode;
  className?: string;
  /** Compact variant for N-Up sheet cells */
  compact?: boolean;
};

/**
 * Minimal frosted-glass PDF page mockup for cinematic intro splash screens.
 */
export function IntroPdfMockup({
  title,
  badge,
  className,
  compact = false,
}: IntroPdfMockupProps) {
  return (
    <div
      className={[
        "pdf-mock",
        compact ? "pdf-mock--compact" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="pdf-mock__glass">
        <div className="pdf-mock__top">
          {badge != null ? <span className="pdf-mock__badge">{badge}</span> : null}
          <span className="pdf-mock__title">{title}</span>
        </div>
        <div className="pdf-mock__lines" aria-hidden>
          <span className="pdf-mock__line" />
          <span className="pdf-mock__line pdf-mock__line--mid" />
          <span className="pdf-mock__line pdf-mock__line--short" />
          {!compact ? <span className="pdf-mock__line pdf-mock__line--mid" /> : null}
        </div>
        <span className="pdf-mock__corner" aria-hidden />
      </div>
    </div>
  );
}
