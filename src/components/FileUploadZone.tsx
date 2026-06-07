"use client";

import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import type { HTMLAttributes, ReactNode } from "react";
import { useToolGlassTheme } from "@/context/ToolGlassContext";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";

function UploadArrowIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <div
      className={clsx(
        "relative rounded-xl border border-white/15 bg-white/[0.06] p-2.5 text-ink transition-all backdrop-blur-sm dark:bg-white/[0.08] dark:text-white",
        active && "scale-[1.02] border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.08)]",
        className,
      )}
      aria-hidden
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 2.5H14.5L20.5 8.5V19.25C20.5 20.2165 19.7165 21 18.75 21H7C6.0335 21 5.25 20.2165 5.25 19.25V4.25C5.25 3.2835 6.0335 2.5 7 2.5Z" opacity="0.85" />
        <path d="M14.5 2.5V7.5C14.5 8.05228 14.9477 8.5 15.5 8.5H20.5" opacity="0.65" />
        <path d="M7.25 14.5H20.5V19.25C20.5 20.2165 19.7165 21 18.75 21H7C6.0335 21 5.25 20.2165 5.25 19.25V14.5H7.25Z" opacity="0.95" />
      </svg>
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
        "inline-flex items-center justify-center rounded-xl border px-4 py-2 text-xs font-semibold backdrop-blur-sm transition-all",
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
  title?: string;
  description?: string;
  /** When false, hides the secondary description line (default: minimalist). */
  showDescription?: boolean;
  input?: ReactNode;
  footer?: ReactNode;
  iconActive?: boolean;
  supportedFormats?: string[];
  variant?: "default" | "hero";
};

function formatBadgeClass() {
  return "border-white/15 bg-white/[0.06] text-ink-muted backdrop-blur-sm dark:text-neutral-300";
}

export function FileUploadZone({
  operation,
  drag = false,
  title: titleProp,
  description: descriptionProp,
  showDescription = false,
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

  const title = titleProp ?? (operation ? ws.uploadTitle() : "");
  const description = descriptionProp ?? (operation && showDescription ? ws.uploadDescription() : undefined);

  return (
    <div
      className={clsx(
        "tool-upload-zone group relative flex w-full flex-col p-6 text-center",
        theme.dropzone,
        isHero ? "min-h-[200px] md:min-h-[220px]" : "min-h-[168px] md:min-h-[188px]",
        active ? theme.dropzoneActive : theme.dropzoneHover,
        className,
      )}
      {...rest}
    >
      {input}
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
        <UploadArrowIcon active={active} />
        <div className="max-w-md space-y-1">
          <p className="text-sm font-semibold tracking-tight text-ink dark:text-white">{title}</p>
          {description ? (
            <p className="text-xs leading-relaxed text-ink-muted">{description}</p>
          ) : null}
        </div>
        <SelectFilesCta
          label={common("selectFiles")}
          ariaLabel={common("selectFilesAria")}
          className={clsx(theme.cta, theme.ctaHover)}
        />
        {supportedFormats.length ? (
          <div className="flex w-full flex-wrap items-center justify-center gap-1.5">
            {supportedFormats.map((format) => (
              <span
                key={format}
                className={clsx(
                  "inline-flex items-center rounded-lg border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  formatBadgeClass(),
                )}
              >
                {format}
              </span>
            ))}
          </div>
        ) : null}
        {footer ? <div className="w-full shrink-0 pt-1">{footer}</div> : null}
        {children}
      </div>
    </div>
  );
}
