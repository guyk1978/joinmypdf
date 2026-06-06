"use client";

import { useTranslations } from "next-intl";
import { useLocaleLayout } from "@/hooks/useLocaleLayout";
import { Link } from "@/i18n/navigation";
import { getToolErrorRecovery } from "@/lib/tool-error-recovery";
import { translateToolItem } from "@/lib/i18n-tool-labels";
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

function toolSlugFromHref(href: string): string | undefined {
  const match = href.match(/\/tools\/([^/]+)/);
  return match?.[1];
}

function translateActionLabel(
  href: string,
  fallback: string,
  tErrors: ReturnType<typeof useTranslations>,
  tTools: ReturnType<typeof useTranslations>,
): string {
  if (href.includes("/pdf-guides") || href.includes("/blog/")) {
    return tErrors("unlockGuide");
  }
  const slug = toolSlugFromHref(href);
  if (slug) return translateToolItem(tTools, slug, fallback);
  return fallback;
}

function translateActionHint(hint: string | undefined, tErrors: ReturnType<typeof useTranslations>): string | undefined {
  if (!hint) return undefined;
  const map: Record<string, string> = {
    "Remove encryption in Acrobat, Preview, or your approved editor first": "unlockGuideHint",
    "Useful after unlock or for partial exports": "trySplitHint",
    "Extract visible pages as images": "exportJpgHint",
    "Pull out readable pages only": "splitReadableHint",
    "Bypass damaged PDF structure": "bypassDamagedHint",
  };
  const key = map[hint];
  return key && tErrors.has(key) ? tErrors(key) : hint;
}

export function ToolErrorRecovery({ operation, slug, kind, technicalMessage, onDismiss }: Props) {
  const tErrors = useTranslations("Workspace.errors");
  const tCommon = useTranslations("Workspace.common");
  const tTools = useTranslations("Tools");
  const { arrow } = useLocaleLayout();

  const content = getToolErrorRecovery(operation, kind, slug);
  const primary = content.actions.find((a) => a.variant === "primary");
  const secondary = content.actions.filter((a) => a.variant === "secondary");

  const headline = tErrors("headline");
  const detail =
    kind === "encrypted"
      ? tErrors("encryptedDetail")
      : kind === "corrupt"
        ? tErrors("corruptDetail")
        : tErrors("genericDetail");

  return (
    <div
      className="rounded-none border border-neutral-300 bg-neutral-100 p-3 dark:border-neutral-800 dark:bg-neutral-900 sm:p-2"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex gap-3 sm:gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-neutral-400 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 text-black dark:text-neutral-200">
          <LockIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-ink sm:text-base">{headline}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{detail}</p>
            {technicalMessage && kind === "generic" ? (
              <p className="mt-2 text-xs text-ink-muted/80">
                <span className="font-medium text-ink-muted">{tCommon("details")} </span>
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
                {translateActionLabel(primary.href, primary.label, tErrors, tTools)}
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
                {translateActionLabel(action.href, action.label, tErrors, tTools)}
              </Link>
            ))}
          </div>

          {(primary?.hint || secondary.some((a) => a.hint)) && (
            <ul className="space-y-1 text-xs text-ink-muted">
              {primary?.hint ? <li>{arrow} {translateActionHint(primary.hint, tErrors)}</li> : null}
              {secondary
                .filter((a) => a.hint)
                .map((a) => (
                  <li key={a.href}>{arrow} {translateActionHint(a.hint, tErrors)}</li>
                ))}
            </ul>
          )}

          {onDismiss ? (
            <button type="button" onClick={onDismiss} className="text-xs font-medium text-black dark:text-neutral-200 hover:underline">
              {tCommon("dismissTryAnother")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
