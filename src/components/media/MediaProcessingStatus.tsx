"use client";

import { clsx } from "clsx";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MediaProcessingPhase } from "@/services/media";

type MediaProcessingStatusProps = {
  phase: MediaProcessingPhase;
  ratio?: number;
  message?: string;
  className?: string;
};

export function MediaProcessingStatus({
  phase,
  ratio = 0,
  message,
  className,
}: MediaProcessingStatusProps) {
  const t = useTranslations("MediaTool");

  if (phase === "idle") return null;

  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  const statusMessage =
    message ??
    (phase === "loading"
      ? t("statusLoading")
      : phase === "processing"
        ? t("statusProcessing")
        : phase === "success"
          ? t("statusSuccess")
          : t("statusError"));

  const Icon =
    phase === "success" ? CheckCircle2 : phase === "error" ? AlertCircle : Loader2;

  return (
    <div
      className={clsx(
        "tool-workspace-panel media-status",
        `media-status--${phase}`,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy={phase === "loading" || phase === "processing"}
    >
      <div className="media-status__row">
        <Icon
          className={clsx(
            "media-status__icon",
            (phase === "loading" || phase === "processing") && "media-status__icon--spin",
          )}
          aria-hidden
        />
        <p className="media-status__message">{statusMessage}</p>
      </div>

      {phase === "processing" ? (
        <div className="media-status__track" aria-hidden>
          <div className="media-status__bar" style={{ width: `${percent}%` }} />
        </div>
      ) : null}
    </div>
  );
}
