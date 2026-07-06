"use client";

import { clsx } from "clsx";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";

export type MediaDropzoneLabels = {
  ariaLabel?: string;
  title?: string;
  titleBusy?: string;
  description?: string;
  privacyBadge?: string;
  formatsHint?: string;
  selectLabel?: string;
};

type MediaDropzoneProps = {
  accept?: string;
  mediaKind?: "audio" | "video" | "any";
  disabled?: boolean;
  busy?: boolean;
  labels?: MediaDropzoneLabels;
  supportedFormats?: string[];
  onFile: (file: File) => void;
  onError?: (message: string) => void;
  className?: string;
};

function defaultAcceptForKind(kind: MediaDropzoneProps["mediaKind"]): string {
  if (kind === "audio") return "audio/*";
  if (kind === "video") return "video/*";
  return "audio/*,video/*";
}

export function MediaDropzone({
  accept,
  mediaKind = "any",
  disabled = false,
  busy = false,
  labels,
  supportedFormats = [],
  onFile,
  onError,
  className,
}: MediaDropzoneProps) {
  const t = useTranslations("MediaTool");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const resolvedAccept = accept || defaultAcceptForKind(mediaKind);
  const isDisabled = disabled || busy;
  const active = drag && !isDisabled;

  const copy = {
    ariaLabel: labels?.ariaLabel ?? t("dropzoneAria"),
    title: busy ? labels?.titleBusy ?? t("dropTitleBusy") : labels?.title ?? t("dropTitle"),
    description: labels?.description ?? t("dropDescription"),
    privacyBadge: labels?.privacyBadge ?? t("privacyBadge"),
    formatsHint: labels?.formatsHint ?? t("formatsHint"),
    selectLabel: labels?.selectLabel ?? t("selectLabel"),
  };

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || isDisabled) return;
      if (
        mediaKind === "audio" &&
        !file.type.startsWith("audio/") &&
        !/\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name)
      ) {
        onError?.(t("errorAudioFormat"));
        return;
      }
      if (
        mediaKind === "video" &&
        !file.type.startsWith("video/") &&
        !/\.(mp4|webm|mov|mkv)$/i.test(file.name)
      ) {
        onError?.(t("errorVideoFormat"));
        return;
      }
      onFile(file);
    },
    [isDisabled, mediaKind, onError, onFile, t],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className={clsx("tool-upload-zone tool-upload-zone--tool-page media-dropzone-shell", className)}>
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={copy.ariaLabel}
        aria-disabled={isDisabled}
        aria-controls={inputId}
        className={clsx(
          "tool-drop-zone",
          active && "tool-drop-zone--active",
          isDisabled && "media-dropzone--disabled",
        )}
        onKeyDown={onKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isDisabled) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDrag(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
        onClick={() => {
          if (!isDisabled) inputRef.current?.click();
        }}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={resolvedAccept}
          className="sr-only"
          disabled={isDisabled}
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        <p className="tool-drop-zone__heading">{copy.title}</p>

        <span className="tool-drop-zone__button">{copy.selectLabel}</span>

        <p className="tool-drop-zone__cloud">{copy.description}</p>

        {supportedFormats.length ? (
          <div className="tool-drop-zone__formats" aria-hidden>
            {supportedFormats.map((format) => (
              <span key={format} className="tool-drop-zone__format">
                {format}
              </span>
            ))}
          </div>
        ) : (
          <p className="tool-drop-zone__cloud">{copy.formatsHint}</p>
        )}
      </div>

      <p className="tool-privacy-badge media-dropzone__privacy" role="note">
        <Shield className="media-dropzone__privacy-icon" aria-hidden />
        <span>{copy.privacyBadge}</span>
      </p>
    </div>
  );
}
