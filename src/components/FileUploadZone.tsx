"use client";

import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import type { HTMLAttributes, ReactNode } from "react";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { localizeHebrewPdfInText } from "@/lib/hebrew-pdf-term";
import { ToolFavoriteButton } from "@/components/ToolFavoriteButton";
import {
  formatSupportsLabel,
  IndustrialMatteDropzone,
} from "@/components/IndustrialMatteDropzone";

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
  dropTitle?: string;
  selectLabel?: string;
  privacyLabel?: string;
  variant?: "default" | "hero";
};

export function FileUploadZone({
  operation,
  drag = false,
  slug: slugProp,
  title: titleProp,
  description: descriptionProp,
  showDescription = false,
  showFormatBadges = true,
  showCloudLinks = false,
  input,
  footer,
  iconActive,
  supportedFormats = ["PDF"],
  dropTitle: dropTitleProp,
  selectLabel: selectLabelProp,
  privacyLabel: privacyLabelProp,
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
  const imageOnly = supportedFormats.every((format) =>
    /jpg|jpeg|png|webp|gif|heic|svg|ico|bmp/i.test(format),
  );

  const dropTitle =
    dropTitleProp ||
    (pdfOnly
      ? common.has("dropYourPdfHere")
        ? common("dropYourPdfHere")
        : "Drop your PDF here"
      : imageOnly
        ? common.has("dropYourImageHere")
          ? common("dropYourImageHere")
          : "Drop your image here"
        : common("dropYourFileHere"));

  const selectLabel =
    selectLabelProp ||
    (pdfOnly
      ? common.has("selectPdfFromDevice")
        ? common("selectPdfFromDevice")
        : "Select PDF from device"
      : imageOnly
        ? common.has("selectImageFromDevice")
          ? common("selectImageFromDevice")
          : "Select image from device"
        : common.has("selectFileFromDevice")
          ? common("selectFileFromDevice")
          : common("selectFile"));

  const privacyLabel =
    privacyLabelProp ||
    (common.has("localProcessingNothingUploaded")
      ? common("localProcessingNothingUploaded")
      : "Local Processing. Nothing is uploaded.");

  const supportsLabel = showFormatBadges
    ? formatSupportsLabel(supportedFormats.map(formatLabel))
    : "";

  return (
    <div
      className={clsx(
        "tool-upload-zone",
        isToolPage ? "tool-upload-zone--tool-page" : isHero ? "tool-upload-zone--hero" : "",
      )}
    >
      {!isToolPage && (displayTitle || displayDescription) ? (
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

      <IndustrialMatteDropzone
        {...rest}
        className={className}
        dropTitle={dropTitle}
        selectLabel={selectLabel}
        supportsLabel={supportsLabel}
        privacyLabel={privacyLabel}
        active={active}
        input={input}
        footer={footer}
      >
        {children}
      </IndustrialMatteDropzone>
    </div>
  );
}
