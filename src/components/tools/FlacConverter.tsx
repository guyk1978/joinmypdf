"use client";

import { clsx } from "clsx";
import { Download, Loader2 } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  flacOutputFormatLabel,
  isFlacFile,
  type FlacOutputFormat,
} from "@/components/tools/ffmpeg/convert-flac";
import {
  useFfmpegFlacConvert,
  type FfmpegFlacConvertResult,
} from "@/components/tools/hooks/useFfmpegFlacConvert";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const FLAC_ACCEPT = "audio/flac,audio/x-flac,.flac";
const OUTPUT_FORMATS: FlacOutputFormat[] = ["mp3", "wav", "aac"];

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

export type FlacConverterProps = ToolModuleProps & {
  onComplete?: (result: FfmpegFlacConvertResult) => void;
};

export function FlacConverter({ title, onComplete }: FlacConverterProps) {
  const formatId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<FlacOutputFormat>("mp3");
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
  } = useFfmpegFlacConvert({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);

  const pickFile = useCallback(
    (next: File) => {
      if (!isFlacFile(next)) {
        setPickError(
          "Invalid or unsupported file. Please upload a valid FLAC (.flac) lossless audio file.",
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
  const outputLabel = flacOutputFormatLabel(outputFormat);

  return (
    <div className="flac-converter-tool space-y-4">
      <p className="text-sm leading-relaxed text-neutral-400">
        {title ??
          "Transcode your lossless FLAC files to MP3, WAV, or other formats locally. High-quality output, 100% private and secure."}{" "}
        ffmpeg.wasm validates the FLAC header, then transcodes in a Web Worker so the page stays
        responsive during heavy encoding.
      </p>

      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      {!file ? (
        <MediaDropzone
          mediaKind="audio"
          accept={FLAC_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["FLAC"]}
          onFile={pickFile}
          onError={(message) => setPickError(message)}
          labels={{
            title: "Upload FLAC file",
            titleBusy: "Transcoding in worker…",
            description: "Drag and drop a FLAC file or browse from your device.",
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300" htmlFor={formatId}>
              Output format
            </label>
            <select
              id={formatId}
              value={outputFormat}
              disabled={busy}
              onChange={(event) => {
                setOutputFormat(event.target.value as FlacOutputFormat);
                reset();
              }}
              className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            >
              {OUTPUT_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {flacOutputFormatLabel(format)}
                  {format === "mp3" ? " (high-quality VBR)" : ""}
                  {format === "aac" ? " (.m4a)" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500">
              MP3 uses <code className="text-neutral-600">-q:a 0</code> for best VBR quality. WAV
              stays lossless PCM. AAC exports as M4A at 256 kbps.
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
                Transcoding…
              </>
            ) : (
              "Convert & Download"
            )}
          </button>
        </div>
      )}

      {phase === "loading" || phase === "processing" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Transcoding progress
        </p>
      ) : null}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
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
          <PostSuccessUpsell operation="flac-converter" fileContext={file?.name} sourceFile={file} />
        </div>
      ) : null}
    </div>
  );
}
