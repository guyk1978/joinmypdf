"use client";

import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import type { HTMLAttributes, ReactNode } from "react";
import { useToolGlassTheme } from "@/context/ToolGlassContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { localizeHebrewPdfInText } from "@/lib/hebrew-pdf-term";
import { ToolFavoriteButton } from "@/components/ToolFavoriteButton";
import { ToolUploadHeroIcon } from "@/components/ToolUploadHeroIcon";
import { ToolUploadZoneBackdrop } from "@/components/ToolUploadZoneBackdrop";

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
  const showToolBackdrop = pageShell.stacked && Boolean(slug) && !isHero;

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
        "tool-upload-zone group relative flex w-full flex-col items-center justify-center px-4 py-8 text-center md:px-8 md:py-10",
        theme.dropzone,
        theme.dropzoneHover,
        isHero ? "min-h-[400px] md:min-h-[460px]" : "tool-upload-zone--tool-page",
        active && theme.dropzoneActive,
        className,
      )}
      {...rest}
    >
      {showToolBackdrop && slug ? <ToolUploadZoneBackdrop slug={slug} headline={displayTitle} /> : null}

      {input}

      <div className="tool-upload-zone__content relative z-[1] flex w-full max-w-2xl flex-col items-center">
        {displayTitle ? (
          <header className="tool-upload-zone__header flex w-full flex-col items-center">
            <div className="tool-upload-zone__title-row inline-flex max-w-full items-center justify-center gap-2.5">
              <h1 className="tool-upload-zone__title text-4xl font-extrabold tracking-tight text-black dark:text-white md:text-5xl">
                {displayTitle}
              </h1>
              {slug ? <ToolFavoriteButton slug={slug} className="shrink-0 self-center" /> : null}
            </div>

            {displayDescription ? (
              <p className="tool-upload-zone__description mt-3 max-w-xl text-base font-normal leading-relaxed text-neutral-600 dark:text-neutral-200 md:text-lg">
                {displayDescription}
              </p>
            ) : null}
          </header>
        ) : displayDescription ? (
          <header className="tool-upload-zone__header flex w-full flex-col items-center">
            <p className="tool-upload-zone__description max-w-xl text-base font-normal leading-relaxed text-neutral-600 dark:text-neutral-200 md:text-lg">
              {displayDescription}
            </p>
          </header>
        ) : null}

        <div className="tool-upload-zone__stage flex w-full items-center justify-center">
          <ToolUploadHeroIcon slug={slug} headline={displayTitle} active={active} />
        </div>

        <footer className="tool-upload-zone__actions flex w-full flex-col items-center">
          <SelectFilesCta
            label={common("selectFiles")}
            ariaLabel={common("selectFilesAria")}
            className={clsx(theme.cta, theme.ctaHover)}
          />

        {showFormatBadges && supportedFormats.length ? (
          <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-2">
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

        {footer ? <div className="w-full shrink-0 pt-6">{footer}</div> : null}
        {children}
        </footer>
      </div>
    </div>
  );
}
