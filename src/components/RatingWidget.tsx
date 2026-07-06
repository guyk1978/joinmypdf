"use client";

import { clsx } from "clsx";
import { CheckCircle2, Clock, Loader2, Sparkles, Target, Zap, type LucideIcon } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { IMPACT_SCORE_KEYS, type ImpactScoreKey } from "@/lib/rating-config";
import { isRatingSubmitError, submitRating } from "@/lib/submit-rating";

const IMPACT_ICONS: Record<ImpactScoreKey, LucideIcon> = {
  savedTime: Clock,
  solvedProblem: Target,
  superFast: Zap,
  easyToUse: Sparkles,
};

type RatingWidgetProps = {
  pageTitle: string;
  fileContext?: string;
  className?: string;
};

export function RatingWidget({ pageTitle, fileContext, className }: RatingWidgetProps) {
  const t = useTranslations("Rating");
  const pathname = usePathname() || "/";
  const groupId = useId();
  const { fileContext: contextFile } = useToolFeedback();
  const resolvedFileContext = fileContext ?? contextFile;

  const [status, setStatus] = useState<"idle" | "submitting" | "thanks">("idle");
  const [errorCode, setErrorCode] = useState<"not_configured" | "send_failed" | null>(null);

  const pageUrl = useMemo(() => {
    if (typeof window === "undefined") return pathname;
    return `${window.location.origin}${pathname}`;
  }, [pathname]);

  const sendRating = useCallback(
    async (impactKey: ImpactScoreKey, impactLabel: string) => {
      setErrorCode(null);
      setStatus("submitting");
      try {
        await submitRating({
          impactKey,
          impactLabel,
          pageUrl:
            typeof window !== "undefined" && window.location?.href
              ? window.location.href
              : pageUrl,
          pageTitle,
          fileContext: resolvedFileContext,
        });
        setStatus("thanks");
      } catch (error) {
        const message = error instanceof Error ? error.message : "send_failed";
        setErrorCode(isRatingSubmitError(message) ? message : "send_failed");
        setStatus("idle");
      }
    },
    [pageTitle, pageUrl, resolvedFileContext],
  );

  if (status === "thanks") {
    return (
      <div
        className={clsx("rating-widget rating-widget--thanks", className)}
        aria-live="polite"
      >
        <CheckCircle2 className="rating-widget__thanks-icon" aria-hidden />
        <p className="rating-widget__thanks-text">{t("thankYou")}</p>
      </div>
    );
  }

  return (
    <div className={clsx("rating-widget", className)} aria-labelledby={`${groupId}-title`}>
      <input type="hidden" name="page_url" value={pageUrl} readOnly aria-hidden />
      <input type="hidden" name="page_title" value={pageTitle} readOnly aria-hidden />
      {resolvedFileContext ? (
        <input type="hidden" name="file_context" value={resolvedFileContext} readOnly aria-hidden />
      ) : null}

      <p id={`${groupId}-title`} className="rating-widget__title">
        {t("title")}
      </p>

      <div className="rating-widget__cards" role="group" aria-label={t("chooseImpact")}>
        {IMPACT_SCORE_KEYS.map((impactKey) => {
          const Icon = IMPACT_ICONS[impactKey];
          const label = t(`impacts.${impactKey}` as "impacts.savedTime");
          return (
            <button
              key={impactKey}
              type="button"
              className="rating-widget__card"
              disabled={status === "submitting"}
              aria-label={label}
              onClick={() => void sendRating(impactKey, label)}
            >
              {status === "submitting" ? (
                <Loader2 className="rating-widget__card-icon rating-widget__card-icon--spin" aria-hidden />
              ) : (
                <Icon className="rating-widget__card-icon" aria-hidden />
              )}
              <span className="rating-widget__card-label">{label}</span>
            </button>
          );
        })}
      </div>

      {errorCode ? (
        <p className="rating-widget__error" role="alert">
          {errorCode === "not_configured" ? t("errors.notConfigured") : t("errors.sendFailed")}
        </p>
      ) : null}
    </div>
  );
}
