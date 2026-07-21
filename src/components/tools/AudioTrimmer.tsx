"use client";

import { clsx } from "clsx";
import { Download, Loader2, Pause, Play, Scissors } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import type { Region } from "wavesurfer.js/dist/plugins/regions.js";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { formatMmSs } from "@/components/tools/ffmpeg/time-input";
import { isSupportedAudioTrimFile } from "@/components/tools/ffmpeg/trim-audio";
import {
  useFfmpegMultiAudioTrim,
  type FfmpegMultiAudioTrimResult,
} from "@/components/tools/hooks/useFfmpegMultiAudioTrim";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const AUDIO_ACCEPT =
  "audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav,audio/ogg,audio/aac,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.oga,.aac,.m4a";

const REGION_ID = "trim-selection";
const MIN_REGION_SECONDS = 0.05;
const DEFAULT_FADE_SECONDS = 1;

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

export type AudioTrimmerProps = ToolModuleProps & {
  onComplete?: (result: FfmpegMultiAudioTrimResult) => void;
};

export function AudioTrimmer({ name, onComplete }: AudioTrimmerProps) {
  const t = useTranslations("AudioTrimmer");
  const fadeInId = useId();
  const fadeOutId = useId();
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const regionRef = useRef<Region | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [endSeconds, setEndSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [waveReady, setWaveReady] = useState(false);
  const [pickError, setPickError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [fadeEnabled, setFadeEnabled] = useState(false);
  const [fadeInSeconds, setFadeInSeconds] = useState(DEFAULT_FADE_SECONDS);
  const [fadeOutSeconds, setFadeOutSeconds] = useState(DEFAULT_FADE_SECONDS);

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
  } = useFfmpegMultiAudioTrim({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!previewUrl || !waveformRef.current) return;

    let disposed = false;
    setWaveReady(false);
    setPlaying(false);
    setCurrentTime(0);

    const regions = RegionsPlugin.create();
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      url: previewUrl,
      height: 112,
      waveColor: "#525252",
      progressColor: "#e5e5e5",
      cursorColor: "#fafafa",
      cursorWidth: 1,
      barWidth: 2,
      barGap: 1,
      barRadius: 0,
      normalize: true,
      interact: true,
    });

    ws.registerPlugin(regions);
    wavesurferRef.current = ws;
    regionsRef.current = regions;

    const syncRegion = (region: Region) => {
      const start = Math.max(0, region.start);
      const end = Math.max(start + MIN_REGION_SECONDS, region.end);
      setStartSeconds(start);
      setEndSeconds(end);
      setValidationError("");
    };

    const onReady = () => {
      if (disposed) return;
      const trackDuration = ws.getDuration();
      setDuration(trackDuration);
      setStartSeconds(0);
      setEndSeconds(trackDuration);
      setWaveReady(true);

      regions.clearRegions();
      const region = regions.addRegion({
        id: REGION_ID,
        start: 0,
        end: trackDuration,
        color: "rgba(250, 250, 250, 0.12)",
        drag: true,
        resize: true,
        minLength: MIN_REGION_SECONDS,
      });
      regionRef.current = region;
      syncRegion(region);
    };

    const unReady = ws.on("ready", onReady);
    const unTime = ws.on("timeupdate", (time) => {
      if (!disposed) setCurrentTime(time);
    });
    const unPlay = ws.on("play", () => {
      if (!disposed) setPlaying(true);
    });
    const unPause = ws.on("pause", () => {
      if (!disposed) setPlaying(false);
    });
    const unFinish = ws.on("finish", () => {
      if (!disposed) setPlaying(false);
    });

    const unUpdate = regions.on("region-updated", (region) => {
      if (region.id === REGION_ID) syncRegion(region);
    });

    return () => {
      disposed = true;
      unReady();
      unTime();
      unPlay();
      unPause();
      unFinish();
      unUpdate();
      regionRef.current = null;
      regionsRef.current = null;
      wavesurferRef.current = null;
      ws.destroy();
    };
  }, [previewUrl]);

  const pickFile = useCallback(
    (next: File) => {
      if (!isSupportedAudioTrimFile(next)) {
        setPickError(t("invalidFile"));
        return;
      }
      setFile(next);
      setPickError("");
      setValidationError("");
      setFadeEnabled(false);
      setFadeInSeconds(DEFAULT_FADE_SECONDS);
      setFadeOutSeconds(DEFAULT_FADE_SECONDS);
      reset();
    },
    [reset, t],
  );

  const togglePlay = useCallback(() => {
    const ws = wavesurferRef.current;
    if (!ws || !waveReady) return;
    void ws.playPause();
  }, [waveReady]);

  const playSelection = useCallback(() => {
    const region = regionRef.current;
    if (!region) return;
    void region.play();
  }, []);

  const trimAndDownload = useCallback(async () => {
    if (!file || busy) return;

    if (endSeconds <= startSeconds) {
      setValidationError(t("rangeError"));
      return;
    }

    const segment = endSeconds - startSeconds;
    if (fadeEnabled && fadeInSeconds + fadeOutSeconds > segment) {
      setValidationError(t("fadeError"));
      return;
    }

    setValidationError("");
    const payload = await trim({
      file,
      startSeconds,
      endSeconds,
      fadeInSeconds: fadeEnabled ? fadeInSeconds : 0,
      fadeOutSeconds: fadeEnabled ? fadeOutSeconds : 0,
    });

    if (payload) {
      downloadBlob(payload.blob, payload.fileName);
    }
  }, [
    busy,
    endSeconds,
    fadeEnabled,
    fadeInSeconds,
    fadeOutSeconds,
    file,
    startSeconds,
    t,
    trim,
  ]);

  const canTrim = Boolean(file) && waveReady && !busy && environment?.canRun !== false;

  return (
    <div className="audio-trimmer-tool space-y-4">

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
          accept={AUDIO_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["MP3", "WAV", "AAC", "OGG"]}
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
        <div className="tool-workspace-panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-neutral-200">
              {file.name} · {formatBytes(file.size)}
              {duration > 0 ? ` · ${formatMmSs(duration)}` : null}
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

          <div className="space-y-3 rounded-none border border-neutral-800 bg-neutral-950 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t("waveformLabel")}
            </p>
            <div
              ref={waveformRef}
              className="audio-trimmer-tool__waveform w-full overflow-hidden"
              aria-label={t("waveformAria")}
            />
            {!waveReady ? (
              <p className="text-xs text-neutral-500">{t("loadingWaveform")}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={toolOutlineBtn}
                disabled={!waveReady || busy}
                onClick={togglePlay}
              >
                {playing ? (
                  <>
                    <Pause className="mr-2 inline h-4 w-4" aria-hidden />
                    {t("pause")}
                  </>
                ) : (
                  <>
                    <Play className="mr-2 inline h-4 w-4" aria-hidden />
                    {t("play")}
                  </>
                )}
              </button>
              <button
                type="button"
                className={toolOutlineBtn}
                disabled={!waveReady || busy}
                onClick={playSelection}
              >
                {t("playSelection")}
              </button>
              <p className="font-mono text-sm text-neutral-300">
                {formatMmSs(currentTime)} / {formatMmSs(duration)}
              </p>
              <p className="font-mono text-xs text-neutral-500">
                {t("keepRange", {
                  start: formatMmSs(startSeconds),
                  end: formatMmSs(endSeconds),
                  seconds: Math.max(0, endSeconds - startSeconds).toFixed(2),
                })}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-none border border-neutral-800 bg-neutral-950 p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                className="accent-neutral-200"
                checked={fadeEnabled}
                disabled={busy}
                onChange={(event) => setFadeEnabled(event.target.checked)}
              />
              <span>{t("fadeLabel")}</span>
            </label>
            <p className="text-xs text-neutral-500">{t("fadeHint")}</p>
            {fadeEnabled ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-neutral-400" htmlFor={fadeInId}>
                    {t("fadeInLabel")}
                  </label>
                  <input
                    id={fadeInId}
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={fadeInSeconds}
                    disabled={busy}
                    onChange={(event) => setFadeInSeconds(Number(event.target.value) || 0)}
                    className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-neutral-400" htmlFor={fadeOutId}>
                    {t("fadeOutLabel")}
                  </label>
                  <input
                    id={fadeOutId}
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={fadeOutSeconds}
                    disabled={busy}
                    onChange={(event) => setFadeOutSeconds(Number(event.target.value) || 0)}
                    className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                  />
                </div>
              </div>
            ) : null}
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
        <div className="tool-workspace-panel space-y-3">
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
          <PostSuccessUpsell operation="audio-trimmer" fileContext={file?.name} sourceFile={file} />
        </div>
      ) : null}
    </div>
  );
}
