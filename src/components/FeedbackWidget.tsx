"use client";

import { clsx } from "clsx";
import { Bug, CheckCircle2, Lightbulb, Loader2, Smile } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { FEEDBACK_REASONS, FEEDBACK_TYPES, type FeedbackType } from "@/lib/feedback-config";
import { isFeedbackSubmitError, submitFeedback } from "@/lib/submit-feedback";

type FeedbackWidgetProps = {
  pageType: "tool" | "article";
  pageTitle: string;
  className?: string;
};

const TYPE_ICONS = {
  happy: Smile,
  bug: Bug,
  suggestion: Lightbulb,
} as const;

export function FeedbackWidget({ pageType, pageTitle, className }: FeedbackWidgetProps) {
  const t = useTranslations("Feedback");
  const pathname = usePathname() || "/";
  const groupId = useId();
  const [activeType, setActiveType] = useState<FeedbackType | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "thanks">("idle");
  const [errorCode, setErrorCode] = useState<"not_configured" | "send_failed" | null>(null);

  const pageUrl = useMemo(() => {
    if (typeof window === "undefined") return pathname;
    return `${window.location.origin}${pathname}`;
  }, [pathname]);

  const reasons = activeType ? FEEDBACK_REASONS[activeType] : [];

  const resetSelection = useCallback(() => {
    setActiveType(null);
    setSelectedReason(null);
  }, []);

  const onSelectType = (type: FeedbackType) => {
    setErrorCode(null);
    setActiveType(type);
    setSelectedReason(FEEDBACK_REASONS[type][0] ?? null);
  };

  const onSubmit = async () => {
    if (!activeType || !selectedReason) return;

    setErrorCode(null);
    setStatus("submitting");
    try {
      await submitFeedback({
        type: activeType,
        reasonLabel: t(`reasons.${selectedReason}` as "reasons.workedAsExpected"),
        pageUrl,
        pageTitle,
        pageType,
      });
      setStatus("thanks");
      resetSelection();
    } catch (error) {
      const message = error instanceof Error ? error.message : "send_failed";
      setErrorCode(isFeedbackSubmitError(message) ? message : "send_failed");
      setStatus("idle");
    }
  };

  if (status === "thanks") {
    return (
      <section className={clsx("feedback-widget feedback-widget--thanks", className)} aria-live="polite">
        <div className="feedback-widget__thanks">
          <CheckCircle2 className="feedback-widget__thanks-icon" aria-hidden />
          <p className="feedback-widget__thanks-text">{t("thankYou")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={clsx("feedback-widget", className)} aria-labelledby={`${groupId}-title`}>
      <input type="hidden" name="page_url" value={pageUrl} readOnly aria-hidden />
      <input type="hidden" name="page_title" value={pageTitle} readOnly aria-hidden />

      <div className="feedback-widget__header">
        <h2 id={`${groupId}-title`} className="feedback-widget__title">
          {t("title")}
        </h2>
        <p className="feedback-widget__subtitle">{t("subtitle")}</p>
      </div>

      <div className="feedback-widget__types" role="group" aria-label={t("chooseType")}>
        {FEEDBACK_TYPES.map((type) => {
          const Icon = TYPE_ICONS[type];
          const isActive = activeType === type;
          return (
            <button
              key={type}
              type="button"
              className={clsx("feedback-widget__type", isActive && "is-active")}
              aria-pressed={isActive}
              aria-expanded={isActive}
              onClick={() => onSelectType(type)}
            >
              <Icon className="feedback-widget__type-icon" aria-hidden />
              <span>{t(`types.${type}`)}</span>
            </button>
          );
        })}
      </div>

      {activeType ? (
        <div className="feedback-widget__panel">
          <fieldset className="feedback-widget__reasons">
            <legend className="feedback-widget__reasons-label">{t(`prompts.${activeType}`)}</legend>
            <ul className="feedback-widget__reason-list">
              {reasons.map((reasonKey) => {
                const inputId = `${groupId}-${activeType}-${reasonKey}`;
                return (
                  <li key={reasonKey}>
                    <label className="feedback-widget__reason" htmlFor={inputId}>
                      <input
                        id={inputId}
                        type="radio"
                        name={`${groupId}-reason`}
                        className="feedback-widget__reason-input"
                        checked={selectedReason === reasonKey}
                        onChange={() => setSelectedReason(reasonKey)}
                      />
                      <span className="feedback-widget__reason-text">{t(`reasons.${reasonKey}` as "reasons.workedAsExpected")}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <div className="feedback-widget__actions">
            <button
              type="button"
              className="feedback-widget__submit"
              disabled={!selectedReason || status === "submitting"}
              onClick={() => void onSubmit()}
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="feedback-widget__submit-icon feedback-widget__submit-icon--spin" aria-hidden />
                  {t("sending")}
                </>
              ) : (
                t("submit")
              )}
            </button>
            <button type="button" className="feedback-widget__cancel" onClick={resetSelection}>
              {t("cancel")}
            </button>
          </div>

          {errorCode ? (
            <p className="feedback-widget__error" role="alert">
              {errorCode === "not_configured" ? t("errors.notConfigured") : t("errors.sendFailed")}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
