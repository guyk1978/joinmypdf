"use client";

import { clsx } from "clsx";
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
} from "react";
import {
  ChooseFilesPicker,
  type ChooseFilesPickerLabels,
} from "@/components/ChooseFilesPicker";
import { useCloudFileImport } from "@/hooks/useCloudFileImport";
import { usePendingFileInputHandoff } from "@/hooks/usePendingFileInputHandoff";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import type { CloudProvider } from "@/lib/cloud-file-picker";
import {
  resolveToolAccentCategoryId,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import {
  getDropzonePatternBackgroundSize,
  getDropzonePatternDataUrl,
  resolveDropzonePatternKind,
  type DropzonePatternKind,
} from "@/lib/dropzone-patterns";

export type ChooseFilesDropzoneLabels = ChooseFilesPickerLabels & {
  orDropFilesHere: string;
  privacyLine: string;
  cloudHint: string;
  ariaLabel?: string;
};

type ChooseFilesDropzoneProps = {
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  busy?: boolean;
  labels: ChooseFilesDropzoneLabels;
  onFile: (file: File) => void;
  onFiles?: (files: File[]) => void;
  onError?: (message: string) => void;
  className?: string;
  showPrivacy?: boolean;
  patternKind?: DropzonePatternKind;
};

/**
 * Standalone white CHOOSE FILES upload stage (Video Muter and similar).
 * Prefer IndustrialMatteDropzone for tools that already wire FileUploadZone / MediaDropzone.
 */
export function ChooseFilesDropzone({
  accept,
  multiple = false,
  disabled = false,
  busy = false,
  labels,
  onFile,
  onFiles,
  onError,
  className,
  showPrivacy = true,
  patternKind: patternKindProp,
}: ChooseFilesDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const { slug } = useToolPageShell();
  usePendingFileInputHandoff(inputRef);

  const isDisabled = disabled || busy;
  const active = drag && !isDisabled;

  const patternKind = useMemo(() => {
    if (patternKindProp) return patternKindProp;
    const categoryId =
      resolveToolAccentCategoryId(slug) ?? resolveToolCategoryId(slug);
    return resolveDropzonePatternKind(slug, categoryId);
  }, [patternKindProp, slug]);

  const patternStyle = useMemo(
    () =>
      ({
        "--dropzone-pattern": getDropzonePatternDataUrl(patternKind),
        "--dropzone-pattern-size": getDropzonePatternBackgroundSize(patternKind),
      }) as CSSProperties,
    [patternKind],
  );

  const handleFiles = useCallback(
    (list: FileList | File[] | null | undefined) => {
      if (!list || isDisabled) return;
      const files = Array.from(list);
      if (!files.length) return;
      if (onFiles) {
        onFiles(files);
        return;
      }
      onFile(files[0]!);
    },
    [isDisabled, onFile, onFiles],
  );

  const openDevicePicker = useCallback(() => {
    if (!isDisabled) inputRef.current?.click();
  }, [isDisabled]);

  const { openCloudImport, cloudImportModal } = useCloudFileImport({
    rootRef: shellRef,
    onPickDevice: openDevicePicker,
    onFiles: (files) => handleFiles(files),
    multiple,
  });

  const onCloudOption = useCallback(
    (provider: CloudProvider) => {
      if (isDisabled) return;
      openCloudImport(provider);
    },
    [isDisabled, openCloudImport],
  );

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDrag(false);
    if (isDisabled) return;
    const files = event.dataTransfer.files;
    if (!files?.length) {
      onError?.("No file dropped.");
      return;
    }
    handleFiles(files);
  };

  const pickerLabels: ChooseFilesPickerLabels = {
    chooseFiles: labels.chooseFiles,
    fromDevice: labels.fromDevice,
    fromDropbox: labels.fromDropbox,
    fromGoogleDrive: labels.fromGoogleDrive,
    fromOneDrive: labels.fromOneDrive,
  };

  return (
    <div
      ref={shellRef}
      className={clsx("im-dropzone-shell choose-files-dropzone", className)}
      data-dropzone-pattern={patternKind}
    >
      {cloudImportModal}
      <div
        className={clsx(
          "im-dropzone im-dropzone--choose-files",
          active && "im-dropzone--active",
          isDisabled && "pointer-events-none opacity-55",
        )}
        style={patternStyle}
        data-dropzone-pattern={patternKind}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={labels.ariaLabel || labels.chooseFiles}
        onClick={() => openDevicePicker()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openDevicePicker();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!isDisabled) setDrag(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isDisabled) setDrag(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setDrag(false);
        }}
        onDrop={onDrop}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          disabled={isDisabled}
          aria-label={labels.ariaLabel || labels.fromDevice}
          onChange={onInputChange}
        />

        <div className="choose-files-dropzone__stage">
          <ChooseFilesPicker
            labels={pickerLabels}
            disabled={isDisabled}
            onPickDevice={openDevicePicker}
            onCloudOption={onCloudOption}
          />
          <p className="choose-files-dropzone__hint">{labels.orDropFilesHere}</p>
        </div>
      </div>

      {showPrivacy ? (
        <p className="choose-files-dropzone__privacy" role="note">
          {labels.privacyLine}
        </p>
      ) : null}
    </div>
  );
}
