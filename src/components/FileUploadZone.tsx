"use client";

import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import type { HTMLAttributes, ReactNode } from "react";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { localizeHebrewPdfInText } from "@/lib/hebrew-pdf-term";
import {
  acceptAttrFromFormats,
  ensureInputAccept,
  extractAcceptFromInput,
  resolveUploadFormats,
  resolveUploadMediaKind,
  type UploadMediaKind,
} from "@/lib/upload-accept";
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
  /** Preferred source of truth for Supports: + labels. Falls back to input accept. */
  supportedFormats?: string[];
  /** Optional accept override when the hidden input does not declare one. */
  accept?: string;
  dropTitle?: string;
  selectLabel?: string;
  privacyLabel?: string;
  variant?: "default" | "hero";
};

function dropTitleForKind(
  kind: UploadMediaKind,
  formats: string[],
  common: ReturnType<typeof useTranslations>,
): string {
  if (kind === "pdf") {
    return common.has("dropYourPdfHere") ? common("dropYourPdfHere") : "Drop a PDF here or click to browse";
  }
  if (kind === "image") {
    return common.has("dropYourImageHere")
      ? common("dropYourImageHere")
      : "Drop an image here or click to browse";
  }
  if (kind === "video") {
    return common.has("dropYourVideoHere")
      ? common("dropYourVideoHere")
      : "Drop a video here or click to browse";
  }
  if (kind === "audio") {
    return common.has("dropYourAudioHere")
      ? common("dropYourAudioHere")
      : "Drop an audio file here or click to browse";
  }
  if (formats.length === 1) {
    const format = formats[0]!;
    return common.has("dropYourFormatHere")
      ? common("dropYourFormatHere", { format })
      : `Drop a ${format} here or click to browse`;
  }
  return common.has("dropYourFileHere")
    ? common("dropYourFileHere")
    : "Drop a file here or click to browse";
}

function selectLabelForKind(
  kind: UploadMediaKind,
  formats: string[],
  common: ReturnType<typeof useTranslations>,
): string {
  if (kind === "pdf") {
    return common.has("selectPdfFromDevice")
      ? common("selectPdfFromDevice")
      : "Select PDF from device";
  }
  if (kind === "image") {
    return common.has("selectImageFromDevice")
      ? common("selectImageFromDevice")
      : "Select image from device";
  }
  if (kind === "video") {
    return common.has("selectVideoFromDevice")
      ? common("selectVideoFromDevice")
      : "Select video from device";
  }
  if (kind === "audio") {
    return common.has("selectAudioFromDevice")
      ? common("selectAudioFromDevice")
      : "Select audio from device";
  }
  if (formats.length === 1) {
    const format = formats[0]!;
    return common.has("selectFormatFromDevice")
      ? common("selectFormatFromDevice", { format })
      : `Select ${format} from device`;
  }
  return common.has("selectFileFromDevice")
    ? common("selectFileFromDevice")
    : "Select file from device";
}

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
  supportedFormats: supportedFormatsProp,
  accept: acceptProp,
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

  const acceptFromInput = extractAcceptFromInput(input);
  const acceptSource = acceptProp || acceptFromInput;
  const supportedFormats = resolveUploadFormats({
    supportedFormats: supportedFormatsProp,
    accept: acceptSource,
  });
  const kind = resolveUploadMediaKind(supportedFormats, acceptSource);
  const resolvedAccept =
    acceptSource ||
    (supportedFormats.length ? acceptAttrFromFormats(supportedFormats) : undefined);
  const resolvedInput = ensureInputAccept(input, resolvedAccept);

  const formatLabel = (format: string) =>
    locale === "he" ? localizeHebrewPdfInText(format) : format;

  const dropTitle =
    dropTitleProp || dropTitleForKind(kind, supportedFormats, common);

  const selectLabel =
    selectLabelProp || selectLabelForKind(kind, supportedFormats, common);

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
        input={resolvedInput}
        footer={footer}
      >
        {children}
      </IndustrialMatteDropzone>
    </div>
  );
}
