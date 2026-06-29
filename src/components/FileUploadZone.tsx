"use client";

import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import type { HTMLAttributes, ReactNode } from "react";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { localizeHebrewPdfInText } from "@/lib/hebrew-pdf-term";
import { ToolFavoriteButton } from "@/components/ToolFavoriteButton";

export type FileUploadZoneProps = HTMLAttributes<HTMLDivElement> & {
  operation?: string;
  drag?: boolean;
  slug?: string;
  title?: string;
  description?: string;
  showDescription?: boolean;
  showFormatBadges?: boolean;
  showCloudLinks?: boolean;
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
  showCloudLinks = true,
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
  const pageShell = useToolPageShell();
  const ws = useWorkspaceI18n(operation ?? "");
  const common = useTranslations("Workspace.common");
  const active = drag || iconActive;
  const isHero = variant === "hero";

  const slug = slugProp || pageShell.slug;
  const isToolPage = pageShell.stacked && Boolean(slug) && !isHero;

  const displayTitle =
    pageShell.headline || titleProp || (operation ? ws.uploadTitle() : "");

  const displayDescription =
    pageShell.subline ||
    descriptionProp ||
    (operation && showDescription ? ws.uploadDescription() : undefined);

  const formatLabel = (format: string) =>
    locale === "he" ? localizeHebrewPdfInText(format) : format;

  const pdfOnly =
    supportedFormats.length === 1 && supportedFormats[0]?.toUpperCase() === "PDF";
  const selectLabel = pdfOnly ? common("selectPdfFile") : common("selectFile");
  const selectAria = pdfOnly ? common("selectPdfFileAria") : common("selectFileAria");

  const dropZone = (
    <div
      className={clsx(
        "tool-drop-zone",
        active && "tool-drop-zone--active",
        isHero && "tool-drop-zone--hero",
        className,
      )}
      {...rest}
    >
      {input}

      <p className="tool-drop-zone__heading">{common("dropYourFileHere")}</p>

      <span className="tool-drop-zone__button" aria-hidden>
        {selectLabel}
      </span>

      {showCloudLinks && isToolPage ? (
        <p className="tool-drop-zone__cloud">{common("uploadFromCloudServices")}</p>
      ) : null}

      {showFormatBadges && supportedFormats.length ? (
        <div className="tool-drop-zone__formats">
          {supportedFormats.map((format) => (
            <span key={format} className="tool-drop-zone__format">
              {formatLabel(format)}
            </span>
          ))}
        </div>
      ) : null}

      {footer ? <div className="tool-drop-zone__footer">{footer}</div> : null}
      {children}
    </div>
  );

  return (
    <div
      className={clsx(
        "tool-upload-zone",
        isToolPage ? "tool-upload-zone--tool-page" : isHero ? "tool-upload-zone--hero" : "",
      )}
    >
      {(displayTitle || displayDescription) ? (
        <header className="tool-upload-zone__page-header">
          {displayTitle ? (
            <div className="tool-upload-zone__title-row">
              <h1 className="tool-upload-zone__page-title">{displayTitle}</h1>
              {slug ? <ToolFavoriteButton slug={slug} className="shrink-0" /> : null}
            </div>
          ) : null}
          {displayDescription ? (
            <p className="tool-upload-zone__page-description">{displayDescription}</p>
          ) : null}
        </header>
      ) : null}

      {dropZone}
    </div>
  );
}
