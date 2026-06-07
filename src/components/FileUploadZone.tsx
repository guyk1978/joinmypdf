"use client";

import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import type { HTMLAttributes, ReactNode } from "react";
import { useToolGlassTheme } from "@/context/ToolGlassContext";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";

function UploadDocumentIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <div
      className={clsx(
        "relative flex h-16 w-16 items-center justify-center rounded-xl border border-neutral-600/80 bg-neutral-800/80 text-neutral-300 shadow-inner transition-transform duration-200",
        active && "scale-[1.03] border-neutral-500",
        className,
      )}
      aria-hidden
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 2.5H14.5L20.5 8.5V19.25C20.5 20.2165 19.7165 21 18.75 21H7C6.0335 21 5.25 20.2165 5.25 19.25V4.25C5.25 3.2835 6.0335 2.5 7 2.5Z" opacity="0.9" />
        <path d="M14.5 2.5V7.5C14.5 8.05228 14.9477 8.5 15.5 8.5H20.5" opacity="0.55" />
        <path d="M7.25 14.5H20.5V19.25C20.5 20.2165 19.7165 21 18.75 21H7C6.0335 21 5.25 20.2165 5.25 19.25V14.5H7.25Z" opacity="0.95" />
      </svg>
      <div className="absolute -end-0.5 -top-0.5 h-2 w-2 rounded-sm bg-neutral-500" />
    </div>
  );
}

function SelectFilesCta({
  label,
  ariaLabel,
  className,
}: {
  label: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center transition-all duration-200",
        className,
      )}
      aria-label={ariaLabel}
    >
      {label}
    </span>
  );
}

export type FileUploadZoneProps = HTMLAttributes<HTMLDivElement> & {
  operation?: string;
  drag?: boolean;
  /** Drag instruction inside drop-zone (not page title). */
  title?: string;
  description?: string;
  showDescription?: boolean;
  showFormatBadges?: boolean;
  input?: ReactNode;
  footer?: ReactNode;
  iconActive?: boolean;
  supportedFormats?: string[];
  variant?: "default" | "hero";
};

export function FileUploadZone({
  operation,
  drag = false,
  title: titleProp,
  description: descriptionProp,
  showDescription = false,
  showFormatBadges = false,
  input,
  footer,
  iconActive,
  supportedFormats = ["PDF"],
  variant = "default",
  className,
  children,
  ...rest
}: FileUploadZoneProps) {
  const theme = useToolGlassTheme();
  const ws = useWorkspaceI18n(operation ?? "");
  const common = useTranslations("Workspace.common");
  const active = drag || iconActive;
  const isHero = variant === "hero";

  const instruction = titleProp ?? (operation ? ws.uploadTitle() : "");
  const description = descriptionProp ?? (operation && showDescription ? ws.uploadDescription() : undefined);

  return (
    <div
      className={clsx(
        "tool-upload-zone group relative flex w-full flex-col items-center justify-center p-6 text-center md:p-8",
        theme.dropzone,
        isHero ? "min-h-[220px] md:min-h-[240px]" : "min-h-[200px] md:min-h-[220px]",
        active ? theme.dropzoneActive : theme.dropzoneHover,
        className,
      )}
      {...rest}
    >
      {input}
      <div className="flex w-full flex-col items-center justify-center gap-5">
        <UploadDocumentIcon active={active} />
        <div className="max-w-md space-y-2">
          <p className="text-sm font-bold tracking-tight text-ink dark:text-white md:text-base">{instruction}</p>
          {description ? <p className="text-xs leading-relaxed text-ink-muted dark:text-neutral-400">{description}</p> : null}
        </div>
        <SelectFilesCta
          label={common("selectFiles")}
          ariaLabel={common("selectFilesAria")}
          className={clsx(theme.cta, theme.ctaHover)}
        />
        {showFormatBadges && supportedFormats.length ? (
          <div className="flex w-full flex-wrap items-center justify-center gap-1.5 pt-1">
            {supportedFormats.map((format) => (
              <span
                key={format}
                className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400"
              >
                {format}
              </span>
            ))}
          </div>
        ) : null}
        {footer ? <div className="w-full shrink-0 pt-2">{footer}</div> : null}
        {children}
      </div>
    </div>
  );
}
