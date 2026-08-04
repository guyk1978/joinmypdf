"use client";

import { clsx } from "clsx";
import { Upload } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { useToolPageShell } from "@/context/ToolPageShellContext";

export type IndustrialMatteDropzoneProps = HTMLAttributes<HTMLDivElement> & {
  /** Tool display name shown above the upload icon (primary dropzones). */
  toolName?: string;
  dropTitle: string;
  selectLabel: string;
  supportsLabel: string;
  privacyLabel?: string;
  active?: boolean;
  disabled?: boolean;
  input?: ReactNode;
  footer?: ReactNode;
  showPrivacy?: boolean;
  className?: string;
  /** Secondary “add more” zone — excluded from immersive clean-phase detection. */
  compact?: boolean;
};

/** Strip redundant “processed/compressed locally…” clauses from Supports lines. */
function cleanSupportsLabel(label: string): string {
  return label
    .replace(/\s*[—–-]\s*(processed|compressed)\s+locally[^]*$/i, "")
    .replace(/\s*\((processed|compressed)\s+locally[^)]*\)\s*$/i, "")
    .replace(/\s+(processed|compressed)\s+locally[^]*$/i, "")
    .trim();
}

function titleCaseSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Shared Industrial Matte upload surface — used by PDF, image, audio, and video tools.
 * Rounded stage with a permanent subtle dashed border; accent solid border on hover/drag.
 */
export function IndustrialMatteDropzone({
  toolName,
  dropTitle,
  selectLabel,
  supportsLabel,
  privacyLabel = "Local Processing. Nothing is uploaded.",
  active = false,
  disabled = false,
  input,
  footer,
  showPrivacy = true,
  className,
  children,
  onClick,
  compact = false,
  ...rest
}: IndustrialMatteDropzoneProps) {
  const pageShell = useToolPageShell();
  const resolvedSupports = cleanSupportsLabel(supportsLabel);
  // Prefer explicit prop (including "" to suppress on homepage hero),
  // then tool page shell headline, then slug title-case.
  // Compact “add more” zones stay instruction-only.
  const resolvedToolName = compact
    ? ""
    : toolName !== undefined
      ? toolName.trim()
      : pageShell.headline?.trim() ||
        (pageShell.slug ? titleCaseSlug(pageShell.slug) : "");

  return (
    <div
        className={clsx(
          "im-dropzone-shell flex w-full flex-col",
          !compact && "min-h-[400px] flex-1",
          className,
        )}
      >
      <div
        {...rest}
        aria-disabled={disabled || undefined}
        className={clsx(
          "im-dropzone group",
          compact && "im-dropzone--compact",
          "flex w-full flex-col items-center justify-center gap-4",
          !compact && "min-h-[400px] flex-1",
          "px-6 py-10 text-center",
          active && "im-dropzone--active",
          disabled && "pointer-events-none opacity-55",
        )}
        onClick={disabled ? undefined : onClick}
      >
        {input}

        <div className="im-dropzone__stage flex max-w-xl flex-col items-center justify-center gap-4">
          {resolvedToolName ? (
            <p className="im-dropzone__tool-name m-0">{resolvedToolName}</p>
          ) : null}

          <span className="im-dropzone__icon" aria-hidden>
            <Upload className="im-dropzone__icon-svg" strokeWidth={1.35} />
          </span>

          <div className="im-dropzone__copy flex flex-col items-center gap-2">
            <p className="im-dropzone__title m-0">{dropTitle}</p>
            <span className="im-dropzone__select m-0">{selectLabel}</span>
          </div>

          {showPrivacy || resolvedSupports ? (
            <div className="im-dropzone__meta flex flex-col items-center gap-2">
              {showPrivacy ? (
                <p
                  className="im-dropzone__privacy m-0 inline-flex items-center justify-center"
                  role="note"
                >
                  <span className="im-dropzone__pulse" aria-hidden />
                  <span>{privacyLabel}</span>
                </p>
              ) : null}
              {resolvedSupports ? (
                <p className="im-dropzone__formats m-0 text-center">{resolvedSupports}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        {footer ? <div className="im-dropzone__footer w-full">{footer}</div> : null}
        {children}
      </div>
    </div>
  );
}

export type FormatSupportsOptions = {
  /** @deprecated Local-processing copy lives on the privacy line; not appended. */
  processedLocallySuffix?: string;
};

export function formatSupportsLabel(
  formats: string[],
  fallback = "",
  _options?: FormatSupportsOptions,
): string {
  let base = "";
  if (formats.length) {
    base = /^supports:/i.test(fallback.trim())
      ? fallback
      : `Supports: ${formats.join(", ")}`;
  } else {
    base = fallback;
  }
  return cleanSupportsLabel(base);
}
