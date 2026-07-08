"use client";

import { clsx } from "clsx";
import { Download, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import {
  formatSupportsLabel,
  IndustrialMatteDropzone,
} from "@/components/IndustrialMatteDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { isCoverImageFile } from "@/components/tools/ffmpeg/create-mp3-to-mp4";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import {
  useFfmpegMp3ToMp4,
  type FfmpegMp3ToMp4Result,
} from "@/components/tools/hooks/useFfmpegMp3ToMp4";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP3_ACCEPT = "audio/mpeg,audio/mp3,.mp3";
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

type UploadSlotProps = {
  dropTitle: string;
  selectLabel: string;
  supportedFormats: string[];
  accept: string;
  file: File | null;
  disabled: boolean;
  onFile: (file: File) => void;
};

function UploadSlot({
  dropTitle,
  selectLabel,
  supportedFormats,
  accept,
  file,
  disabled,
  onFile,
}: UploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  return (
    <IndustrialMatteDropzone
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      active={dragActive}
      disabled={disabled}
      dropTitle={dropTitle}
      selectLabel={selectLabel}
      supportsLabel={formatSupportsLabel(supportedFormats)}
      showPrivacy={!file}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setDragActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (event.currentTarget === event.target) setDragActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        if (disabled) return;
        const dropped = event.dataTransfer.files[0];
        if (dropped) onFile(dropped);
      }}
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      input={
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            const picked = event.target.files?.[0];
            if (picked) onFile(picked);
            event.target.value = "";
          }}
        />
      }
      footer={
        file ? (
          <p className="m-0 truncate text-xs text-neutral-400">
            {file.name} · {formatBytes(file.size)}
          </p>
        ) : null
      }
    />
  );
}

export type Mp3ToMp4Props = ToolModuleProps & {
  onComplete?: (result: FfmpegMp3ToMp4Result) => void;
};

export function Mp3ToMp4({ title, onComplete }: Mp3ToMp4Props) {
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pickError, setPickError] = useState("");

  const {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    result,
    create,
    reset,
  } = useFfmpegMp3ToMp4({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);
  const isDisabled = busy || Boolean(blockingError);

  const pickMp3 = useCallback(
    (next: File) => {
      if (!isMp3File(next)) {
        setPickError("Please upload a valid MP3 audio file.");
        return;
      }
      setMp3File(next);
      setPickError("");
      reset();
    },
    [reset],
  );

  const pickImage = useCallback(
    (next: File) => {
      if (!isCoverImageFile(next)) {
        setPickError("Please upload a cover image (JPG, PNG, or WebP).");
        return;
      }
      setImageFile(next);
      setPickError("");
      reset();
    },
    [reset],
  );

  const createAndDownload = useCallback(async () => {
    if (!mp3File || !imageFile || busy) return;

    const payload = await create(mp3File, imageFile);
    if (payload) {
      downloadBlob(payload.blob, payload.fileName);
    }
  }, [busy, create, imageFile, mp3File]);

  const canCreate =
    Boolean(mp3File && imageFile) && !busy && environment?.canRun !== false;

  return (
    <div className="mp3-to-mp4-tool space-y-4">
      <p className="text-sm leading-relaxed text-neutral-400">
        {title ??
          "Turn an MP3 and a static cover image into an MP4 video for YouTube, Instagram, and other platforms. ffmpeg.wasm loops the image over your audio track — 100% local and private."}
      </p>

      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <UploadSlot
          dropTitle="Drop your cover image here"
          selectLabel="Select image from device"
          supportedFormats={["JPG", "PNG", "WebP"]}
          accept={IMAGE_ACCEPT}
          file={imageFile}
          disabled={isDisabled}
          onFile={pickImage}
        />
        <UploadSlot
          dropTitle="Drop your MP3 here"
          selectLabel="Select MP3 from device"
          supportedFormats={["MP3"]}
          accept={MP3_ACCEPT}
          file={mp3File}
          disabled={isDisabled}
          onFile={pickMp3}
        />
      </div>

      {mp3File || imageFile ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-neutral-500">
            {mp3File && imageFile
              ? "Both files ready — create your shareable MP4."
              : "Upload both a cover image and an MP3 to continue."}
          </p>
          <button
            type="button"
            className={toolOutlineBtn}
            disabled={busy}
            onClick={() => {
              setMp3File(null);
              setImageFile(null);
              setPickError("");
              reset();
            }}
          >
            Clear all
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
        disabled={!canCreate}
        onClick={() => void createAndDownload()}
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
            Creating video…
          </>
        ) : (
          "Create Video & Download"
        )}
      </button>

      {phase === "loading" || phase === "processing" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Video creation progress
        </p>
      ) : null}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-emerald-400">
            Ready — {formatBytes(result.blob.size)} MP4 created on your device.
          </p>
          <button
            type="button"
            className={toolPrimaryBtn}
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            Download {result.fileName}
          </button>
          <PostSuccessUpsell
            operation="mp3-to-mp4"
            fileContext={mp3File?.name}
            sourceFile={mp3File}
          />
        </div>
      ) : null}
    </div>
  );
}
