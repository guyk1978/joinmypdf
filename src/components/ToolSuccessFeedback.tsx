"use client";

import { clsx } from "clsx";
import { Bug, CheckCircle2, Loader2, Smile } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { FEEDBACK_REASONS } from "@/lib/feedback-config";
import { isFeedbackSubmitError, submitFeedback } from "@/lib/submit-feedback";

type ToolSuccessFeedbackProps = {
  pageTitle: string;
  fileContext?: string;
  className?: string;
};

export function ToolSuccessFeedback({ pageTitle, fileContext, className }: ToolSuccessFeedbackProps) {
  const t = useTranslations("Feedback");
  const pathname = usePathname() || "/";
  const groupId = useId();
  const { fileContext: contextFile } = useToolFeedback();
  const resolvedFileContext = fileContext ?? contextFile;

  const [bugOpen, setBugOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>(FEEDBACK_REASONS.bug[0]);
  const [status, setStatus] = useState<"idle" | "submitting" | "thanks">("idle");
  const [errorCode, setErrorCode] = useState<"not_configured" | "send_failed" | null>(null);

  const pageUrl = useMemo(() => {
    if (typeof window === "undefined") return pathname;
    return `${window.location.origin}${pathname}`;
  }, [pathname]);

  const sendFeedback = useCallback(
    async (type: "happy" | "bug", reasonKey: string) => {
      const reasonLabel = t(`reasons.${reasonKey}` as "reasons.workedAsExpected");
      const submitPageUrl =
        typeof window !== "undefined" && window.location?.href
          ? window.location.href
          : pageUrl;

      setErrorCode(null);
      setStatus("submitting");
      try {
        await submitFeedback({
          type,
          reasonLabel,
          pageUrl: submitPageUrl,
          pageTitle,
          pageType: "tool",
          fileContext: type === "bug" ? resolvedFileContext : undefined,
        });
        setStatus("thanks");
        setBugOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "send_failed";
        setErrorCode(isFeedbackSubmitError(message) ? message : "send_failed");
        setStatus("idle");
      }
    },
    [pageTitle, pageUrl, resolvedFileContext, t],
  );

  if (status === "thanks") {
    return (
      <div className={clsx("feedback-widget feedback-widget--compact feedback-widget--thanks", className)} aria-live="polite">
        <CheckCircle2 className="feedback-widget__thanks-icon" aria-hidden />
        <p className="feedback-widget__thanks-text">{t("thankYou")}</p>
      </div>
    );
  }

  return (
    <div className={clsx("feedback-widget feedback-widget--compact", className)} aria-labelledby={`${groupId}-title`}>
      <input type="hidden" name="page_url" value={pageUrl} readOnly aria-hidden />
      <input type="hidden" name="page_title" value={pageTitle} readOnly aria-hidden />
      {resolvedFileContext ? (
        <input type="hidden" name="file_context" value={resolvedFileContext} readOnly aria-hidden />
      ) : null}

      <p id={`${groupId}-title`} className="feedback-widget__compact-title">
        {t("toolPrompt")}
      </p>

      <div className="feedback-widget__types feedback-widget__types--compact" role="group" aria-label={t("chooseType")}>
        <button
          type="button"
          className="feedback-widget__type feedback-widget__type--compact"
          disabled={status === "submitting"}
          aria-label={t("types.happy")}
          onClick={() => void sendFeedback("happy", "workedAsExpected")}
        >
          {status === "submitting" && !bugOpen ? (
            <Loader2 className="feedback-widget__type-icon feedback-widget__submit-icon--spin" aria-hidden />
          ) : (
            <Smile className="feedback-widget__type-icon" aria-hidden />
          )}
          <span>{t("types.happy")}</span>
        </button>
        <button
          type="button"
          className={clsx("feedback-widget__type feedback-widget__type--compact", bugOpen && "is-active")}
          disabled={status === "submitting"}
          aria-expanded={bugOpen}
          aria-label={t("types.bug")}
          onClick={() => setBugOpen((open) => !open)}
        >
          <Bug className="feedback-widget__type-icon" aria-hidden />
          <span>{t("types.bug")}</span>
        </button>
      </div>

      {bugOpen ? (
        <div className="feedback-widget__panel feedback-widget__panel--compact">
          <fieldset className="feedback-widget__reasons">
            <legend className="feedback-widget__reasons-label">{t("prompts.bug")}</legend>
            <ul className="feedback-widget__reason-list">
              {FEEDBACK_REASONS.bug.map((reasonKey) => {
                const inputId = `${groupId}-bug-${reasonKey}`;
                return (
                  <li key={reasonKey}>
                    <label className="feedback-widget__reason" htmlFor={inputId}>
                      <input
                        id={inputId}
                        type="radio"
                        name={`${groupId}-bug-reason`}
                        className="feedback-widget__reason-input"
                        checked={selectedReason === reasonKey}
                        onChange={() => setSelectedReason(reasonKey)}
                      />
                      <span className="feedback-widget__reason-text">
                        {t(`reasons.${reasonKey}` as "reasons.workedAsExpected")}
                      </span>
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
              disabled={status === "submitting"}
              onClick={() => {
                const reasonKey = selectedReason;
                void sendFeedback("bug", reasonKey);
              }}
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
            <button type="button" className="feedback-widget__cancel" onClick={() => setBugOpen(false)}>
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
    </div>
  );
}
