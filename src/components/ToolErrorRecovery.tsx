"use client";

import Link from "next/link";
import { getToolErrorRecovery } from "@/lib/tool-error-recovery";
import type { PdfErrorKind } from "@/lib/pdf-errors";
import { ctaPrimary, ctaSecondary } from "@/lib/cta-styles";
import { capture, EVENTS } from "@/components/AnalyticsClient";

type Props = {
  operation: string;
  slug: string;
  kind: PdfErrorKind;
  technicalMessage?: string;
  onDismiss?: () => void;
};

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3 4 7v5c0 5.25 3.5 9.74 8 11 4.5-1.26 8-5.75 8-11V7l-8-4Z"
      />
      <path strokeLinecap="round" d="M9 14v2h6v-2M12 11v3" />
    </svg>
  );
}

export function ToolErrorRecovery({ operation, slug, kind, technicalMessage, onDismiss }: Props) {
  const content = getToolErrorRecovery(operation, kind, slug);
  const primary = content.actions.find((a) => a.variant === "primary");
  const secondary = content.actions.filter((a) => a.variant === "secondary");

  return (
    <div
      className="rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/[0.08] via-white/[0.03] to-brand/[0.06] p-4 sm:p-5"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200">
          <LockIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-ink sm:text-base">{content.headline}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{content.detail}</p>
            {technicalMessage && kind === "generic" ? (
              <p className="mt-2 text-xs text-ink-muted/80">
                <span className="font-medium text-ink-muted">Details: </span>
                {technicalMessage}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {primary ? (
              <Link
                href={primary.href}
                className={`${ctaPrimary} w-full justify-center sm:w-auto`}
                onClick={() =>
                  capture(EVENTS.tool_error_recovery_click, {
                    operation,
                    slug,
                    kind,
                    target: primary.href,
                    label: primary.label,
                  })
                }
              >
                {primary.label}
              </Link>
            ) : null}
            {secondary.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`${ctaSecondary} w-full justify-center sm:w-auto`}
                onClick={() =>
                  capture(EVENTS.tool_error_recovery_click, {
                    operation,
                    slug,
                    kind,
                    target: action.href,
                    label: action.label,
                  })
                }
              >
                {action.label}
              </Link>
            ))}
          </div>

          {(primary?.hint || secondary.some((a) => a.hint)) && (
            <ul className="space-y-1 text-xs text-ink-muted">
              {primary?.hint ? <li>→ {primary.hint}</li> : null}
              {secondary
                .filter((a) => a.hint)
                .map((a) => (
                  <li key={a.href}>→ {a.hint}</li>
                ))}
            </ul>
          )}

          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs font-medium text-brand hover:underline"
            >
              Dismiss and try another file
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
