"use client";

import { clsx } from "clsx";
import { Download, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import {
  useFfmpegMp3ToWav,
  type FfmpegMp3ToWavResult,
} from "@/components/tools/hooks/useFfmpegMp3ToWav";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP3_ACCEPT = "audio/mpeg,audio/mp3,.mp3";

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

export type Mp3ToWavProps = ToolModuleProps & {
  onComplete?: (result: FfmpegMp3ToWavResult) => void;
};

export function Mp3ToWav({ name, onComplete }: Mp3ToWavProps) {
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
  } = useFfmpegMp3ToWav({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || error;

  const pickFile = useCallback(
    (next: File) => {
      if (!isMp3File(next)) {
        setPickError("Please choose an MP3 file — this tool exports uncompressed WAV locally.");
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
    <div className="mp3-to-wav-tool space-y-4">

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
          accept={MP3_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["MP3"]}
          onFile={pickFile}
          onError={(message) => setPickError(message)}
          labels={{
            title: `Upload MP3 for ${name}`,
            titleBusy: "Converting in worker…",
            description: "Drag and drop an MP3 or browse from your device.",
          }}
        />
      ) : (
        <div className="tool-workspace-panel space-y-4">
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
              "Convert to WAV"
            )}
          </button>
        </div>
      )}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="tool-workspace-panel space-y-3">
          <p className="text-sm text-emerald-400">
            Ready — {formatBytes(result.blob.size)} WAV generated on your device.
          </p>
          <button
            type="button"
            className={toolPrimaryBtn}
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            Download {result.fileName}
          </button>
          <PostSuccessUpsell operation="mp3-to-wav" fileContext={file?.name} sourceFile={file} />
        </div>
      ) : null}
    </div>
  );
}
