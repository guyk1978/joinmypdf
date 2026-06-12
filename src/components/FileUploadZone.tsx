"use client";

import { clsx } from "clsx";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import type { HTMLAttributes, ReactNode } from "react";
import { useToolGlassTheme } from "@/context/ToolGlassContext";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";

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
        "inline-flex items-center justify-center transition-all duration-300",
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
        "tool-upload-zone group relative flex w-full flex-col items-center justify-center px-6 py-12 text-center md:px-10 md:py-14",
        theme.dropzone,
        theme.dropzoneHover,
        isHero ? "min-h-[280px] md:min-h-[300px]" : "min-h-[260px] md:min-h-[280px]",
        active && theme.dropzoneActive,
        className,
      )}
      {...rest}
    >
      {input}
      <div className="flex w-full max-w-md flex-col items-center justify-center">
        <div
          className={clsx(
            "flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-200/80 bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm transition-all duration-300 dark:border-neutral-700 dark:bg-white/[0.04] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
            active && "scale-105 border-[rgba(var(--tool-accent-rgb),0.45)] shadow-[0_0_28px_rgba(var(--tool-accent-rgb),0.2)]",
            "group-hover:border-neutral-400 group-hover:shadow-[0_0_24px_rgba(var(--tool-accent-rgb),0.12)] dark:group-hover:border-neutral-600",
          )}
          aria-hidden
        >
          <Upload
            className={clsx(
              "h-7 w-7 text-neutral-500 transition-colors duration-300 dark:text-neutral-400",
              active && "text-[rgb(var(--tool-accent-rgb))] dark:text-[rgb(var(--tool-accent-rgb))]",
            )}
          />
        </div>

        {instruction ? (
          <p className="mt-6 text-sm font-medium tracking-tight text-neutral-600 dark:text-neutral-300 md:text-base">
            {instruction}
          </p>
        ) : null}

        {description ? (
          <p className="mt-2 text-xs font-normal leading-relaxed text-neutral-500 dark:text-neutral-500 md:text-sm">
            {description}
          </p>
        ) : null}

        <SelectFilesCta
          label={common("selectFiles")}
          ariaLabel={common("selectFilesAria")}
          className={clsx("mt-6", theme.cta, theme.ctaHover)}
        />

        {showFormatBadges && supportedFormats.length ? (
          <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-2">
            {supportedFormats.map((format) => (
              <span
                key={format}
                className="inline-flex items-center rounded-full border border-neutral-200/80 bg-white/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 backdrop-blur-sm dark:border-neutral-700 dark:bg-white/[0.04] dark:text-neutral-400"
              >
                {format}
              </span>
            ))}
          </div>
        ) : null}

        {footer ? <div className="w-full shrink-0 pt-4">{footer}</div> : null}
        {children}
      </div>
    </div>
  );
}
