"use client";

import { clsx } from "clsx";
import { Download, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { isMp4File } from "@/components/tools/ffmpeg/convert-mp4-to-mp3";
import {
  useFfmpegMp4ToMp3,
  type FfmpegMp4ToMp3Result,
} from "@/components/tools/hooks/useFfmpegMp4ToMp3";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP4_ACCEPT = "video/mp4,application/mp4,.mp4";

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

export type Mp4ToMp3Props = ToolModuleProps & {
  onComplete?: (result: FfmpegMp4ToMp3Result) => void;
};

export function Mp4ToMp3({ title, onComplete }: Mp4ToMp3Props) {
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
  } = useFfmpegMp4ToMp3({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);

  const pickFile = useCallback(
    (next: File) => {
      if (!isMp4File(next)) {
        setPickError("Invalid or unsupported file. Please upload a valid MP4 (.mp4) video file.");
        return;
      }
      setFile(next);
      setPickError("");
      reset();
    },
    [reset],
  );

  const extractAndDownload = useCallback(async () => {
    if (!file || busy) return;

    const payload = await convert(file);
    if (payload) {
      downloadBlob(payload.blob, payload.fileName);
    }
  }, [busy, convert, file]);

  const canConvert = Boolean(file) && !busy && environment?.canRun !== false;

  return (
    <div className="mp4-to-mp3-tool space-y-4">

      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      {!file ? (
        <MediaDropzone
          mediaKind="video"
          accept={MP4_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["MP4"]}
          onFile={pickFile}
          onError={(message) => setPickError(message)}
          labels={{
            title: "Upload MP4 video",
            titleBusy: "Extracting audio in worker…",
            description: "Drag and drop an MP4 file or browse from your device.",
            privacyBadge: "100% Private — processed locally with ffmpeg.wasm.",
          }}
          className="rounded-none border-neutral-800 bg-[#1a1a1a]"
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
            onClick={() => void extractAndDownload()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                Extracting…
              </>
            ) : (
              "Convert & Download MP3"
            )}
          </button>
        </div>
      )}

      {phase === "loading" || phase === "processing" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Extraction progress
        </p>
      ) : null}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="tool-workspace-panel space-y-3">
          <p className="text-sm text-emerald-400">
            Ready — {formatBytes(result.blob.size)} MP3 extracted on your device.
          </p>
          <button
            type="button"
            className={toolPrimaryBtn}
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            Download {result.fileName}
          </button>
          <PostSuccessUpsell operation="mp4-to-mp3" fileContext={file?.name} sourceFile={file} />
        </div>
      ) : null}
    </div>
  );
}
