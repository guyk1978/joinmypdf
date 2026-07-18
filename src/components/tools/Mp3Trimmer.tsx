"use client";

import { clsx } from "clsx";
import { Download, Loader2, Scissors } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { formatMmSs, parseMmSs, validateTrimRange } from "@/components/tools/ffmpeg/time-input";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import {
  useFfmpegAudioTrim,
  type FfmpegAudioTrimResult,
} from "@/components/tools/hooks/useFfmpegAudioTrim";
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

export type Mp3TrimmerProps = ToolModuleProps & {
  onComplete?: (result: FfmpegAudioTrimResult) => void;
};

export function Mp3Trimmer({ name, title: _title, onComplete }: Mp3TrimmerProps) {
  const t = useTranslations("Mp3Trimmer");
  const startId = useId();
  const endId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("01:00");
  const [pickError, setPickError] = useState("");
  const [validationError, setValidationError] = useState("");

  const {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    result,
    trim,
    reset,
  } = useFfmpegAudioTrim({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setDuration(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onAudioMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;

    const trackDuration = audio.duration;
    setDuration(trackDuration);
    setEndTime(formatMmSs(trackDuration));
    setStartTime("00:00");
  }, []);

  const pickFile = useCallback(
    (next: File) => {
      if (!isMp3File(next)) {
        setPickError(t("invalidFile"));
        return;
      }
      setFile(next);
      setPickError("");
      setValidationError("");
      setStartTime("00:00");
      setEndTime("01:00");
      reset();
    },
    [reset, t],
  );

  const trimAndDownload = useCallback(async () => {
    if (!file || busy) return;

    const validation = validateTrimRange(startTime, endTime, duration ?? undefined);
    if (validation) {
      setValidationError(validation);
      return;
    }

    setValidationError("");
    const startParsed = parseMmSs(startTime);
    const endParsed = parseMmSs(endTime);
    if (!startParsed || !endParsed) return;

    const payload = await trim({
      file,
      startSeconds: startParsed.seconds,
      endSeconds: endParsed.seconds,
    });

    if (payload) {
      downloadBlob(payload.blob, payload.fileName);
    }
  }, [busy, duration, endTime, file, startTime, trim]);

  const canTrim = Boolean(file) && !busy && environment?.canRun !== false;

  return (
    <div className="mp3-trimmer-tool space-y-4">

      <FfmpegEnvironmentNotice
        environment={environment}
        error={
          validationError ||
          pickError ||
          blockingError ||
          (phase === "error" ? error : undefined)
        }
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
            title: t("uploadTitle", { name }),
            titleBusy: t("uploadTitleBusy"),
            description: t("uploadDescription"),
            privacyBadge: t("privacyBadge"),
          }}
          className="rounded-none border-neutral-800 bg-[#1a1a1a]"
        />
      ) : (
        <div className="space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-neutral-200">
              {file.name} · {formatBytes(file.size)}
              {duration !== null ? ` · ${formatMmSs(duration)}` : null}
            </p>
            <button
              type="button"
              className={toolOutlineBtn}
              disabled={busy}
              onClick={() => {
                setFile(null);
                setPickError("");
                setValidationError("");
                reset();
              }}
            >
              {t("chooseAnother")}
            </button>
          </div>

          {previewUrl ? (
            <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t("previewLabel")}
              </p>
              <audio
                ref={audioRef}
                src={previewUrl}
                controls
                preload="metadata"
                className="w-full"
                onLoadedMetadata={onAudioMetadata}
              />
              <p className="text-xs text-neutral-500">
                {t("previewHint")}
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300" htmlFor={startId}>
                {t("startLabel")}
              </label>
              <input
                id={startId}
                type="text"
                inputMode="numeric"
                placeholder="00:30"
                value={startTime}
                disabled={busy}
                onChange={(event) => {
                  setStartTime(event.target.value);
                  setValidationError("");
                }}
                className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300" htmlFor={endId}>
                {t("endLabel")}
              </label>
              <input
                id={endId}
                type="text"
                inputMode="numeric"
                placeholder="02:15"
                value={endTime}
                disabled={busy}
                onChange={(event) => {
                  setEndTime(event.target.value);
                  setValidationError("");
                }}
                className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canTrim}
            onClick={() => void trimAndDownload()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                {t("trimming")}
              </>
            ) : (
              <>
                <Scissors className="mr-2 inline h-4 w-4" aria-hidden />
                {t("trimAndDownload")}
              </>
            )}
          </button>
        </div>
      )}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-emerald-400">
            {t("success", { size: formatBytes(result.blob.size) })}
          </p>
          <button
            type="button"
            className={toolPrimaryBtn}
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            {t("downloadAgain")}
          </button>
          <PostSuccessUpsell operation="mp3-trimmer" fileContext={file?.name} sourceFile={file} />
        </div>
      ) : null}
    </div>
  );
}
