"use client";

import { clsx } from "clsx";
import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  formatSupportsLabel,
  IndustrialMatteDropzone,
} from "@/components/IndustrialMatteDropzone";

export type ImageToolDropzoneProps = {
  dropTitle: string;
  selectLabel: string;
  selectAria?: string;
  dropHint?: string;
  /** Fully localized formats/help label; bypasses the legacy English "Supports:" prefix. */
  supportsLabel?: string;
  supportedFormats?: string[];
  privacyLabel?: string;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: FileList | File[]) => void;
  className?: string;
  children?: ReactNode;
};

/**
 * Industrial Matte dropzone wrapper for image / favicon tools that manage
 * their own file input state outside of FileUploadZone.
 */
export function ImageToolDropzone({
  dropTitle,
  selectLabel,
  selectAria,
  dropHint,
  supportsLabel: localizedSupportsLabel,
  supportedFormats = [],
  privacyLabel = "Local Processing. Nothing is uploaded.",
  accept,
  multiple = false,
  disabled = false,
  onFiles,
  className,
  children,
}: ImageToolDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const supportsLabel =
    localizedSupportsLabel ??
    formatSupportsLabel(
      supportedFormats,
      dropHint ? (/^supports:/i.test(dropHint) ? dropHint : `Supports: ${dropHint}`) : "",
    );

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || disabled) return;
    onFiles(files);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  return (
    <IndustrialMatteDropzone
      className={clsx(className)}
      dropTitle={dropTitle}
      selectLabel={selectLabel}
      supportsLabel={supportsLabel}
      privacyLabel={privacyLabel}
      active={dragActive}
      disabled={disabled}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={selectAria || selectLabel}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setDragActive(false);
      }}
      onDrop={onDrop}
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      input={
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          aria-label={selectAria || selectLabel}
          disabled={disabled}
          onChange={onInputChange}
        />
      }
    >
      {children}
    </IndustrialMatteDropzone>
  );
}
