"use client";

import { clsx } from "clsx";
import { Download, Loader2, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { MAX_BOOST, MIN_BOOST } from "@/components/tools/ffmpeg/boost-mp3";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import {
  useFfmpegAudioBoost,
  type FfmpegAudioBoostResult,
} from "@/components/tools/hooks/useFfmpegAudioBoost";
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

export type Mp3VolumeBoosterProps = ToolModuleProps & {
  onComplete?: (result: FfmpegAudioBoostResult) => void;
};

export function Mp3VolumeBooster({ name: _name, title, onComplete }: Mp3VolumeBoosterProps) {
  const t = useTranslations("Mp3VolumeBooster");
  const sliderId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [boostedUrl, setBoostedUrl] = useState<string | null>(null);
  const [boostLevel, setBoostLevel] = useState(1.5);
  const [pickError, setPickError] = useState("");

  const {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    result,
    boost,
    reset,
  } = useFfmpegAudioBoost({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);

  useEffect(() => {
    if (!file) {
      setOriginalUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!result?.blob) {
      setBoostedUrl(null);
      return;
    }
    const url = URL.createObjectURL(result.blob);
    setBoostedUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  const pickFile = useCallback(
    (next: File) => {
      if (!isMp3File(next)) {
        setPickError(t("invalidFile"));
        return;
      }
      setFile(next);
      setPickError("");
      setBoostLevel(1.5);
      reset();
    },
    [reset, t],
  );

  const boostAndDownload = useCallback(async () => {
    if (!file || busy) return;

    const payload = await boost({ file, boostLevel });
    if (payload) {
      downloadBlob(payload.blob, payload.fileName);
    }
  }, [boost, boostLevel, busy, file]);

  const canBoost = Boolean(file) && !busy && environment?.canRun !== false;

  return (
    <div className="mp3-volume-booster-tool space-y-4">
      <p className="text-sm leading-relaxed text-neutral-400">{title ?? t("intro")}</p>

      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

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
            title: t("uploadTitle"),
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
              {t("chooseAnother")}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t("originalLabel")}
              </p>
              {originalUrl ? (
                <audio src={originalUrl} controls preload="metadata" className="w-full" />
              ) : null}
            </div>

            <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t("boostedLabel")}
              </p>
              {boostedUrl ? (
                <audio src={boostedUrl} controls preload="metadata" className="w-full" />
              ) : (
                <p className="py-4 text-center text-xs text-neutral-500">{t("previewHint")}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-neutral-300" htmlFor={sliderId}>
                {t("boostLevel")}
              </label>
              <span className="text-sm font-semibold tabular-nums text-neutral-100">
                {boostLevel.toFixed(1)}×
              </span>
            </div>
            <input
              id={sliderId}
              type="range"
              min={MIN_BOOST}
              max={MAX_BOOST}
              step={0.1}
              value={boostLevel}
              disabled={busy}
              onChange={(event) => setBoostLevel(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-none bg-neutral-800 accent-neutral-100"
            />
            <div className="flex justify-between text-xs text-neutral-500">
              <span>{t("normalizeHint", { min: MIN_BOOST })}</span>
              <span>{t("maxBoostHint", { max: MAX_BOOST })}</span>
            </div>
          </div>

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canBoost}
            onClick={() => void boostAndDownload()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                {t("normalizing")}
              </>
            ) : (
              <>
                <Volume2 className="mr-2 inline h-4 w-4" aria-hidden />
                {t("boostAndDownload")}
              </>
            )}
          </button>
        </div>
      )}

      {phase === "loading" || phase === "processing" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {t("progressLabel")}
        </p>
      ) : null}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-emerald-400">
            {t("success", {
              size: formatBytes(result.blob.size),
              level: boostLevel.toFixed(1),
            })}
          </p>
          <button
            type="button"
            className={toolPrimaryBtn}
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            {t("downloadAgain")}
          </button>
          <PostSuccessUpsell operation="mp3-volume-booster" fileContext={file?.name} sourceFile={file} />
        </div>
      ) : null}
    </div>
  );
}
