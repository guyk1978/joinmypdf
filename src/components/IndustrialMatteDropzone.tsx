"use client";

import { clsx } from "clsx";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useMemo,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  ChooseFilesPicker,
  type ChooseFilesPickerLabels,
} from "@/components/ChooseFilesPicker";
import { useCloudFileImport } from "@/hooks/useCloudFileImport";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import {
  getDropzonePatternBackgroundSize,
  getDropzonePatternDataUrl,
  resolveDropzonePatternKind,
  type DropzonePatternKind,
} from "@/lib/dropzone-patterns";
import {
  resolveToolAccentCategoryId,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import type { CloudProvider } from "@/lib/cloud-file-picker";

export type IndustrialMatteDropzoneProps = HTMLAttributes<HTMLDivElement> & {
  /** @deprecated Tool name is no longer shown inside the upload stage. */
  toolName?: string;
  /** @deprecated Replaced by the global CHOOSE FILES stage copy. */
  dropTitle: string;
  /** @deprecated Replaced by the global CHOOSE FILES stage copy. */
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
  /** Override auto-resolved interior pattern (image / pdf / video / …). */
  patternKind?: DropzonePatternKind;
  /**
   * Optional direct sink for cloud-imported File objects. When omitted, files
   * are assigned onto the hidden file input (same path as a device upload).
   */
  onCloudFiles?: (files: File[]) => void;
  /** Allow multi-select in cloud pickers when the tool accepts multiple files. */
  cloudMultiple?: boolean;
};

/** Strip redundant “processed/compressed locally…” clauses from Supports lines. */
function cleanSupportsLabel(label: string): string {
  return label
    .replace(/\s*[—–-]\s*(processed|compressed)\s+locally[^]*$/i, "")
    .replace(/\s*\((processed|compressed)\s+locally[^)]*\)\s*$/i, "")
    .replace(/\s+(processed|compressed)\s+locally[^]*$/i, "")
    .trim();
}

/**
 * Shared upload surface for PDF, image, audio, and video tools.
 * White CHOOSE FILES stage — click/drop anywhere; source menu on the button.
 */
export function IndustrialMatteDropzone({
  toolName: _toolName,
  dropTitle: _dropTitle,
  selectLabel: _selectLabel,
  supportsLabel,
  privacyLabel = "Processed 100% locally · Zero server uploads",
  active = false,
  disabled = false,
  input,
  footer,
  showPrivacy = true,
  className,
  children,
  onClick,
  compact = false,
  patternKind: patternKindProp,
  onCloudFiles,
  cloudMultiple = false,
  style,
  ...rest
}: IndustrialMatteDropzoneProps) {
  const common = useTranslations("Workspace.common");
  const { slug } = useToolPageShell();
  const shellRef = useRef<HTMLDivElement>(null);
  const resolvedSupports = cleanSupportsLabel(supportsLabel);

  const patternKind = useMemo(() => {
    if (patternKindProp) return patternKindProp;
    const categoryId =
      resolveToolAccentCategoryId(slug) ?? resolveToolCategoryId(slug);
    return resolveDropzonePatternKind(slug, categoryId);
  }, [patternKindProp, slug]);

  const patternStyle = useMemo(() => {
    return {
      ...style,
      "--dropzone-pattern": getDropzonePatternDataUrl(patternKind),
      "--dropzone-pattern-size": getDropzonePatternBackgroundSize(patternKind),
    } as CSSProperties;
  }, [patternKind, style]);

  const pickerLabels: ChooseFilesPickerLabels = {
    chooseFiles: common.has("chooseFiles") ? common("chooseFiles") : "CHOOSE FILES",
    fromDevice: common.has("fromDevice") ? common("fromDevice") : "From device",
    fromDropbox: common.has("fromDropbox") ? common("fromDropbox") : "From Dropbox",
    fromGoogleDrive: common.has("fromGoogleDrive")
      ? common("fromGoogleDrive")
      : "From Google Drive",
    fromOneDrive: common.has("fromOneDrive") ? common("fromOneDrive") : "From OneDrive",
  };

  const dropHint = common.has("orDropFilesHere")
    ? common("orDropFilesHere")
    : "or drop files here";

  const openDevicePicker = () => {
    if (disabled || !onClick) return;
    // Parents attach browse handlers as onClick (event is unused).
    onClick({} as never);
  };

  const { openCloudImport, cloudImportModal } = useCloudFileImport({
    rootRef: shellRef,
    onPickDevice: openDevicePicker,
    onFiles: onCloudFiles,
    multiple: cloudMultiple,
  });

  const onCloudOption = (provider: CloudProvider) => {
    if (disabled) return;
    openCloudImport(provider);
  };

  return (
    <div
      ref={shellRef}
      className={clsx(
        "im-dropzone-shell choose-files-dropzone flex w-full flex-col",
        !compact && "min-h-[400px] flex-1",
        className,
      )}
      data-dropzone-pattern={patternKind}
    >
      {cloudImportModal}
      <div
        {...rest}
        style={patternStyle}
        aria-disabled={disabled || undefined}
        data-dropzone-pattern={patternKind}
        className={clsx(
          "im-dropzone im-dropzone--choose-files group",
          compact && "im-dropzone--compact",
          "flex w-full flex-col items-center",
          !compact && "min-h-[400px] flex-1",
          active && "im-dropzone--active",
          disabled && "pointer-events-none opacity-55",
        )}
        onClick={disabled ? undefined : onClick}
      >
        {input}

        <div className="choose-files-dropzone__stage">
          <ChooseFilesPicker
            labels={pickerLabels}
            disabled={disabled}
            onPickDevice={openDevicePicker}
            onCloudOption={onCloudOption}
          />
          <p className="choose-files-dropzone__hint">{dropHint}</p>
        </div>

        {footer ? <div className="im-dropzone__footer w-full">{footer}</div> : null}
        {children}
      </div>

      {showPrivacy || resolvedSupports ? (
        <div className="choose-files-dropzone__meta">
          {showPrivacy ? (
            <p className="choose-files-dropzone__privacy" role="note">
              <Shield
                className="choose-files-dropzone__privacy-icon"
                aria-hidden
                strokeWidth={1.75}
              />
              <span>{privacyLabel}</span>
            </p>
          ) : null}
          {resolvedSupports ? (
            <p className="choose-files-dropzone__formats">{resolvedSupports}</p>
          ) : null}
        </div>
      ) : null}
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
