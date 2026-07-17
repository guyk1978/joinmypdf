"use client";

import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export type IndustrialMatteDropzoneProps = HTMLAttributes<HTMLDivElement> & {
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
};

/**
 * Shared Industrial Matte upload surface — used by PDF, image, audio, and video tools.
 * Labels are always passed in so each tool can show purpose-specific copy.
 */
export function IndustrialMatteDropzone({
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
  ...rest
}: IndustrialMatteDropzoneProps) {
  return (
    <div className={clsx("im-dropzone-shell w-full", className)}>
      <div
        {...rest}
        aria-disabled={disabled || undefined}
        className={clsx(
          "im-dropzone group",
          "flex w-full flex-col items-center justify-center gap-3",
          "bg-neutral-950 px-6 py-12 text-center",
          "border border-transparent border-b-2 border-b-neutral-700",
          "transition-[border-color,background-color,color] duration-200",
          active && "im-dropzone--active",
          disabled && "pointer-events-none opacity-55",
        )}
        onClick={disabled ? undefined : onClick}
      >
        {input}

        <p className="im-dropzone__title m-0 text-lg text-neutral-500">{dropTitle}</p>

        <span className="im-dropzone__select m-0 text-base font-medium">
          {selectLabel}
        </span>

        {footer ? <div className="im-dropzone__footer w-full">{footer}</div> : null}
        {children}
      </div>

      {showPrivacy ? (
        <p
          className="im-dropzone__privacy m-0 inline-flex items-center justify-center text-sm text-neutral-500"
          role="note"
        >
          <span
            className="mr-2 inline-block h-2 w-2 animate-pulse rounded-[9999px] bg-green-500"
            aria-hidden
          />
          <span>{privacyLabel}</span>
        </p>
      ) : null}

      {supportsLabel ? (
        <p className="im-dropzone__formats m-0 text-center text-xs text-neutral-600">{supportsLabel}</p>
      ) : null}
    </div>
  );
}

export function formatSupportsLabel(formats: string[], fallback = ""): string {
  if (!formats.length) return fallback;
  if (/^supports:/i.test(fallback.trim())) return fallback;
  return `Supports: ${formats.join(", ")}`;
}
