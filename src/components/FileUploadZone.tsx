"use client";

import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import type { HTMLAttributes, ReactNode } from "react";
import { useToolGlassTheme } from "@/context/ToolGlassContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { getToolIcon, TOOL_ICON_BARE_CLASS } from "@/lib/tool-icons";
import { localizeHebrewPdfInText } from "@/lib/hebrew-pdf-term";
import { ToolFavoriteButton } from "@/components/ToolFavoriteButton";

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
        "inline-flex items-center justify-center transition-colors duration-200",
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
  /** Override tool slug for icon when outside ToolPageShellProvider */
  slug?: string;
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
  slug: slugProp,
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
  const locale = useLocale();
  const theme = useToolGlassTheme();
  const pageShell = useToolPageShell();
  const ws = useWorkspaceI18n(operation ?? "");
  const common = useTranslations("Workspace.common");
  const active = drag || iconActive;
  const isHero = variant === "hero";

  const slug = slugProp || pageShell.slug;
  const visual = getToolIcon(slug, pageShell.headline || titleProp);

  const displayTitle =
    pageShell.headline ||
    titleProp ||
    (operation ? ws.uploadTitle() : "");

  const displayDescription =
    pageShell.subline ||
    descriptionProp ||
    (operation && showDescription ? ws.uploadDescription() : undefined);

  const formatLabel = (format: string) =>
    locale === "he" ? localizeHebrewPdfInText(format) : format;

  return (
    <div
      className={clsx(
        "tool-upload-zone group relative flex w-full flex-col items-center justify-center px-4 py-6 text-center md:px-6 md:py-8",
        theme.dropzone,
        theme.dropzoneHover,
        isHero ? "min-h-[400px] md:min-h-[460px]" : "min-h-[420px] md:min-h-[500px]",
        active && theme.dropzoneActive,
        className,
      )}
      {...rest}
    >
      {input}

      <div className="flex w-full max-w-2xl flex-col items-center justify-center">
        {displayTitle ? (
          <div className="tool-upload-zone__title-row inline-flex max-w-full items-center justify-center gap-2.5">
            <h1 className="tool-upload-zone__title text-4xl font-extrabold tracking-tight text-black dark:text-white md:text-5xl">
              {displayTitle}
            </h1>
            {slug ? <ToolFavoriteButton slug={slug} className="shrink-0 self-center" /> : null}
          </div>
        ) : null}

        {displayDescription ? (
          <p className="tool-upload-zone__description mt-2 max-w-xl text-base font-normal leading-relaxed text-neutral-700 dark:text-white md:text-lg">
            {displayDescription}
          </p>
        ) : null}

        <span
          className={clsx(
            "tool-upload-zone__icon mt-5 md:mt-6",
            TOOL_ICON_BARE_CLASS,
            "inline-flex items-center justify-center transition-transform duration-300",
            "[&_svg]:h-[15rem] [&_svg]:w-[15rem] sm:[&_svg]:h-[18rem] sm:[&_svg]:w-[18rem] md:[&_svg]:h-[22rem] md:[&_svg]:w-[22rem]",
            active && "scale-[1.03]",
          )}
          aria-hidden
        >
          {visual.icon}
        </span>

        <SelectFilesCta
          label={common("selectFiles")}
          ariaLabel={common("selectFilesAria")}
          className={clsx("mt-5 md:mt-6", theme.cta, theme.ctaHover)}
        />

        {showFormatBadges && supportedFormats.length ? (
          <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-2">
            {supportedFormats.map((format) => (
              <span
                key={format}
                className="inline-flex items-center rounded-none border border-neutral-300 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
              >
                {formatLabel(format)}
              </span>
            ))}
          </div>
        ) : null}

        {footer ? <div className="w-full shrink-0 pt-8">{footer}</div> : null}
        {children}
      </div>
    </div>
  );
}
