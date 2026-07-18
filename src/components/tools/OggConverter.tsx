"use client";

import { clsx } from "clsx";
import { Download, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { isOggFile } from "@/components/tools/ffmpeg/convert-ogg-to-mp3";
import {
  useFfmpegOggToMp3,
  type FfmpegOggToMp3Result,
} from "@/components/tools/hooks/useFfmpegOggToMp3";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const OGG_ACCEPT = "audio/ogg,audio/opus,application/ogg,.ogg,.opus";

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

export type OggConverterProps = ToolModuleProps & {
  onComplete?: (result: FfmpegOggToMp3Result) => void;
};

export function OggConverter({ onComplete }: OggConverterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pickError, setPickError] = useState("");

  const {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    result,
    convert,
    reset,
  } = useFfmpegOggToMp3({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || error;

  const pickFile = useCallback(
    (next: File) => {
      if (!isOggFile(next)) {
        setPickError(
          "Invalid OGG/Opus file. Please upload a valid .ogg or Opus audio file for local conversion.",
        );
        return;
      }
      setFile(next);
      setPickError("");
      reset();
    },
    [reset],
  );

  const canConvert = Boolean(file) && !busy && environment?.canRun !== false;

  return (
    <div className="ogg-converter-tool space-y-4">

      <FfmpegEnvironmentNotice
        environment={environment}
        error={displayError && phase === "error" ? displayError : pickError || blockingError}
      />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      {!file ? (
        <MediaDropzone
          mediaKind="audio"
          accept={OGG_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["OGG", "Opus"]}
          onFile={pickFile}
          onError={(message) => setPickError(message)}
          labels={{
            title: "Upload OGG/Opus file",
            titleBusy: "Converting in worker…",
            description: "Drag and drop an OGG or Opus file or browse from your device.",
            privacyBadge: "100% Private — processed locally with ffmpeg.wasm.",
          }}
          className="rounded-none border-neutral-800 bg-[#1a1a1a]"
        />
      ) : (
        <div className="space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-neutral-200">
              {file.name} · {formatBytes(file.size)}
            </p>
            <button
              type="button"
              className={toolOutlineBtn}
              disabled={busy}
              onClick={() => {
                setFile(null);
                setPickError("");
                reset();
              }}
            >
              Choose another file
            </button>
          </div>

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canConvert}
            onClick={() => void convert(file)}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                Converting…
              </>
            ) : (
              "Convert & Download"
            )}
          </button>
        </div>
      )}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-emerald-400">
            Ready — {formatBytes(result.blob.size)} MP3 generated on your device.
          </p>
          <button
            type="button"
            className={toolPrimaryBtn}
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            Download {result.fileName}
          </button>
          <PostSuccessUpsell operation="ogg-converter" fileContext={file?.name} sourceFile={file} />
        </div>
      ) : null}
    </div>
  );
}
