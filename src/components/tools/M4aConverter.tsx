"use client";

import { clsx } from "clsx";
import { Download, Loader2 } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  isM4aOrAacFile,
  m4aOutputFormatLabel,
  type M4aOutputFormat,
} from "@/components/tools/ffmpeg/convert-m4a";
import {
  useFfmpegM4aConvert,
  type FfmpegM4aConvertResult,
} from "@/components/tools/hooks/useFfmpegM4aConvert";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const M4A_ACCEPT = "audio/mp4,audio/m4a,audio/aac,audio/x-m4a,.m4a,.aac";
const OUTPUT_FORMATS: M4aOutputFormat[] = ["mp3", "wav"];

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

export type M4aConverterProps = ToolModuleProps & {
  onComplete?: (result: FfmpegM4aConvertResult) => void;
};

export function M4aConverter({ title, onComplete }: M4aConverterProps) {
  const formatId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<M4aOutputFormat>("mp3");
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
  } = useFfmpegM4aConvert({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);

  const pickFile = useCallback(
    (next: File) => {
      if (!isM4aOrAacFile(next)) {
        setPickError(
          "Invalid or unsupported file. Please upload a valid M4A or AAC (.m4a, .aac) audio file.",
        );
        return;
      }
      setFile(next);
      setPickError("");
      reset();
    },
    [reset],
  );

  const convertAndDownload = useCallback(async () => {
    if (!file || busy) return;

    const payload = await convert(file, outputFormat);
    if (payload) {
      downloadBlob(payload.blob, payload.fileName);
    }
  }, [busy, convert, file, outputFormat]);

  const canConvert = Boolean(file) && !busy && environment?.canRun !== false;
  const outputLabel = m4aOutputFormatLabel(outputFormat);

  return (
    <div className="m4a-converter-tool space-y-4">

      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      {!file ? (
        <MediaDropzone
          mediaKind="audio"
          accept={M4A_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["M4A", "AAC"]}
          onFile={pickFile}
          onError={(message) => setPickError(message)}
          labels={{
            title: "Upload M4A or AAC file",
            titleBusy: "Converting in worker…",
            description: "Drag and drop an M4A/AAC file or browse from your device.",
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300" htmlFor={formatId}>
              Output format
            </label>
            <select
              id={formatId}
              value={outputFormat}
              disabled={busy}
              onChange={(event) => {
                setOutputFormat(event.target.value as M4aOutputFormat);
                reset();
              }}
              className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            >
              {OUTPUT_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {m4aOutputFormatLabel(format)}
                  {format === "mp3" ? " (high-quality VBR)" : " (lossless PCM)"}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500">
              MP3 uses <code className="text-neutral-600">-q:a 0</code> for best VBR quality. WAV
              exports uncompressed PCM for editing.
            </p>
          </div>

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canConvert}
            onClick={() => void convertAndDownload()}
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

      {phase === "loading" || phase === "processing" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Conversion progress
        </p>
      ) : null}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="tool-workspace-panel space-y-3">
          <p className="text-sm text-emerald-400">
            Ready — {formatBytes(result.blob.size)} {outputLabel} generated on your device.
          </p>
          <button
            type="button"
            className={toolPrimaryBtn}
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            Download {result.fileName}
          </button>
          <PostSuccessUpsell operation="m4a-converter" fileContext={file?.name} sourceFile={file} />
        </div>
      ) : null}
    </div>
  );
}
