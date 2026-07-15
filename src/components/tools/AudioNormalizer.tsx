"use client";

import { clsx } from "clsx";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  Trash2,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  formatSupportsLabel,
  IndustrialMatteDropzone,
} from "@/components/IndustrialMatteDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  analyzeAmplitude,
  buildLoudnormFilter,
  DEFAULT_PEAK_TARGET_DB,
  DEFAULT_TARGET_LUFS,
  DEFAULT_TRUE_PEAK_DB,
  isSupportedNormalizeFile,
  MAX_TARGET_LUFS,
  MIN_TARGET_LUFS,
  peakGainToTarget,
  scalePeaks,
  type AmplitudeAnalysis,
  type NormalizeMode,
} from "@/components/tools/ffmpeg/normalize-audio";
import {
  useFfmpegAudioNormalize,
  type FfmpegAudioNormalizeBatchResult,
} from "@/components/tools/hooks/useFfmpegAudioNormalize";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const AUDIO_ACCEPT = "audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav,.mp3,.wav";

type BatchItem = {
  id: string;
  file: File;
};

function createBatchItem(file: File): BatchItem {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${file.name}-${Date.now()}-${Math.random()}`,
    file,
  };
}

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

function validateBatch(files: File[]): string | null {
  const invalid = files.find((file) => !isSupportedNormalizeFile(file));
  if (invalid) {
    return `Invalid file "${invalid.name}". Please upload MP3 or WAV files only.`;
  }
  return null;
}

function itemStatus(
  item: BatchItem,
  result: FfmpegAudioNormalizeBatchResult | null,
  busy: boolean,
  processingName: string | null,
): "pending" | "processing" | "done" | "error" {
  if (!result) {
    if (busy && processingName === item.file.name) return "processing";
    return "pending";
  }

  if (result.successes.some((success) => success.sourceName === item.file.name)) {
    return "done";
  }
  if (result.failures.some((failure) => failure.sourceName === item.file.name)) {
    return "error";
  }
  return "pending";
}

type WaveOverlayProps = {
  beforePeaks: number[];
  afterPeaks: number[];
  analyzing: boolean;
  peakDb: number | null;
  previewGainDb: number;
};

function WaveOverlay({
  beforePeaks,
  afterPeaks,
  analyzing,
  peakDb,
  previewGainDb,
}: WaveOverlayProps) {
  return (
    <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Before / after amplitude
        </p>
        {peakDb !== null ? (
          <p className="font-mono text-xs text-neutral-500">
            Peak {peakDb.toFixed(1)} dBFS · preview gain {previewGainDb >= 0 ? "+" : ""}
            {previewGainDb.toFixed(1)} dB
          </p>
        ) : null}
      </div>
      {analyzing ? (
        <p className="text-xs text-neutral-500">Analyzing amplitude locally…</p>
      ) : beforePeaks.length === 0 ? (
        <p className="text-xs text-neutral-500">Upload audio to preview levels.</p>
      ) : (
        <div
          className="audio-normalizer-tool__wave relative h-20 w-full overflow-hidden"
          aria-hidden
        >
          <div className="absolute inset-0 flex items-end gap-px">
            {beforePeaks.map((value, index) => (
              <span
                key={`b-${index}`}
                className="min-w-0 flex-1 bg-neutral-600/70"
                style={{ height: `${Math.max(4, value * 100)}%` }}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-end gap-px opacity-80">
            {afterPeaks.map((value, index) => (
              <span
                key={`a-${index}`}
                className="min-w-0 flex-1 bg-emerald-400/35"
                style={{ height: `${Math.max(4, value * 100)}%` }}
              />
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3 text-[0.6875rem] uppercase tracking-wide text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 bg-neutral-600" /> Before
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 bg-emerald-400/60" /> After preview
        </span>
      </div>
    </div>
  );
}

export type AudioNormalizerProps = ToolModuleProps & {
  onComplete?: (result: FfmpegAudioNormalizeBatchResult) => void;
};

export function AudioNormalizer({ title, onComplete }: AudioNormalizerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lufsId = useId();
  const modePeakId = useId();
  const modeLoudId = useId();

  const [items, setItems] = useState<BatchItem[]>([]);
  const [pickError, setPickError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [mode, setMode] = useState<NormalizeMode>("loudnorm");
  const [targetLufs, setTargetLufs] = useState(DEFAULT_TARGET_LUFS);
  const [peakToMinusOne, setPeakToMinusOne] = useState(true);
  const [analysis, setAnalysis] = useState<AmplitudeAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    currentIndex,
    totalCount,
    currentFileName,
    result,
    normalizeBatch,
    reset,
  } = useFfmpegAudioNormalize({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);

  const previewFile = items[0]?.file ?? null;

  useEffect(() => {
    if (!previewFile) {
      setAnalysis(null);
      setAnalyzing(false);
      return;
    }

    let cancelled = false;
    setAnalyzing(true);
    void analyzeAmplitude(previewFile)
      .then((next) => {
        if (!cancelled) setAnalysis(next);
      })
      .catch(() => {
        if (!cancelled) setAnalysis(null);
      })
      .finally(() => {
        if (!cancelled) setAnalyzing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [previewFile]);

  const previewGainDb = useMemo(() => {
    if (!analysis) return 0;
    if (mode === "peak") {
      return peakToMinusOne ? peakGainToTarget(analysis.peakDb, DEFAULT_PEAK_TARGET_DB) : 0;
    }
    // Rough envelope preview for loudnorm: nudge toward target vs RMS stand-in.
    const approx = targetLufs - analysis.rmsDb;
    return Math.max(-12, Math.min(12, approx * 0.35));
  }, [analysis, mode, peakToMinusOne, targetLufs]);

  const afterPeaks = useMemo(() => {
    if (!analysis) return [];
    return scalePeaks(analysis.peaks, previewGainDb);
  }, [analysis, previewGainDb]);

  const loudnormPreview = buildLoudnormFilter(targetLufs, DEFAULT_TRUE_PEAK_DB);

  const addFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) return;

      const batchError = validateBatch(incoming);
      if (batchError) {
        setPickError(batchError);
        return;
      }

      setItems((current) => [...current, ...incoming.map(createBatchItem)]);
      setPickError("");
      reset();
    },
    [reset],
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((current) => current.filter((item) => item.id !== id));
      reset();
    },
    [reset],
  );

  const normalizeAndDownloadAll = useCallback(async () => {
    if (items.length === 0 || busy) return;

    const files = items.map((item) => item.file);
    const batchError = validateBatch(files);
    if (batchError) {
      setPickError(batchError);
      return;
    }

    if (mode === "peak" && !peakToMinusOne) {
      setPickError("Enable “Normalize peak to −1.0 dBFS” or switch to LUFS mode.");
      return;
    }

    const payload = await normalizeBatch(files, {
      mode,
      targetLufs,
      truePeakDb: mode === "peak" ? DEFAULT_PEAK_TARGET_DB : DEFAULT_TRUE_PEAK_DB,
    });

    if (payload?.zipBlob && payload.successes.length > 0) {
      downloadBlob(payload.zipBlob, payload.zipFileName);
    }
  }, [busy, items, mode, normalizeBatch, peakToMinusOne, targetLufs]);

  const canNormalize =
    items.length > 0 &&
    !busy &&
    environment?.canRun !== false &&
    (mode === "loudnorm" || peakToMinusOne);
  const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0);
  const isDisabled = busy || Boolean(blockingError);

  return (
    <div className="audio-normalizer-tool space-y-4">
      <p className="text-sm leading-relaxed text-neutral-400">
        {title ??
          "Online audio normalizer — unify MP3/WAV volume for podcasts and playlists. Batch-normalize locally with ffmpeg.wasm."}{" "}
        Choose target loudness (LUFS) or peak-normalize to −1.0 dB. 100% private — nothing is
        uploaded.
      </p>

      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      <IndustrialMatteDropzone
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        active={dragActive}
        disabled={isDisabled}
        dropTitle={busy ? "Normalizing in worker…" : "Drop MP3 or WAV files (batch OK)"}
        selectLabel="Select audio from device"
        supportsLabel={formatSupportsLabel(["MP3", "WAV"])}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!isDisabled) setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isDisabled) setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget === event.target) setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (isDisabled) return;
          addFiles(Array.from(event.dataTransfer.files));
        }}
        onClick={() => {
          if (!isDisabled) inputRef.current?.click();
        }}
        input={
          <input
            ref={inputRef}
            type="file"
            accept={AUDIO_ACCEPT}
            multiple
            disabled={isDisabled}
            className="sr-only"
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
        }
      />

      {items.length > 0 ? (
        <div className="space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-neutral-200">
              {items.length} file{items.length === 1 ? "" : "s"} · {formatBytes(totalBytes)} total
              {items.length > 1 ? " · Batch Normalize" : null}
            </p>
            <button
              type="button"
              className={toolOutlineBtn}
              disabled={busy}
              onClick={() => {
                setItems([]);
                setPickError("");
                reset();
              }}
            >
              Clear all
            </button>
          </div>

          <WaveOverlay
            beforePeaks={analysis?.peaks ?? []}
            afterPeaks={afterPeaks}
            analyzing={analyzing}
            peakDb={analysis?.peakDb ?? null}
            previewGainDb={previewGainDb}
          />

          <fieldset className="space-y-3 border border-neutral-800 bg-neutral-950 p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Normalization settings
            </legend>

            <div className="flex flex-col gap-2 text-sm text-neutral-300">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  id={modeLoudId}
                  type="radio"
                  name="normalize-mode"
                  checked={mode === "loudnorm"}
                  disabled={busy}
                  onChange={() => setMode("loudnorm")}
                  className="accent-neutral-200"
                />
                Target loudness (LUFS) — podcast / playlist leveling
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  id={modePeakId}
                  type="radio"
                  name="normalize-mode"
                  checked={mode === "peak"}
                  disabled={busy}
                  onChange={() => setMode("peak")}
                  className="accent-neutral-200"
                />
                Peak normalize
              </label>
            </div>

            {mode === "loudnorm" ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm text-neutral-300" htmlFor={lufsId}>
                    Target loudness
                  </label>
                  <span className="font-mono text-sm text-neutral-100">{targetLufs} LUFS</span>
                </div>
                <input
                  id={lufsId}
                  type="range"
                  min={MIN_TARGET_LUFS}
                  max={MAX_TARGET_LUFS}
                  step={1}
                  value={targetLufs}
                  disabled={busy}
                  onChange={(event) => setTargetLufs(Number(event.target.value))}
                  className="w-full accent-neutral-200"
                />
                <p className="text-xs text-neutral-500">
                  ffmpeg filter:{" "}
                  <code className="text-neutral-400">{loudnormPreview}</code>. −16 LUFS suits
                  podcasts; −14 is hotter for music beds.
                </p>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  className="accent-neutral-200"
                  checked={peakToMinusOne}
                  disabled={busy}
                  onChange={(event) => setPeakToMinusOne(event.target.checked)}
                />
                Normalize peak to −1.0 dBFS (make audio louder consistently without clipping)
              </label>
            )}
          </fieldset>

          <ul className="space-y-2">
            {items.map((item) => {
              const status = itemStatus(item, result, busy, currentFileName);
              const failure = result?.failures.find(
                (entry) => entry.sourceName === item.file.name,
              );

              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 border border-neutral-800 bg-neutral-950 px-3 py-2"
                >
                  <div className="mt-0.5 shrink-0 text-neutral-500">
                    {status === "processing" ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden />
                    ) : status === "error" ? (
                      <AlertCircle className="h-4 w-4 text-amber-500" aria-hidden />
                    ) : (
                      <Volume2 className="h-4 w-4" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-100">{item.file.name}</p>
                    <p className="text-xs text-neutral-500">{formatBytes(item.file.size)}</p>
                    {failure ? (
                      <p className="mt-1 text-xs text-amber-500/90">{failure.message}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className={toolOutlineBtn}
                    disabled={busy}
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>

          {busy && totalCount > 0 ? (
            <p className="text-xs text-neutral-500">
              Processing file {currentIndex} of {totalCount}…
            </p>
          ) : null}

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canNormalize}
            onClick={() => void normalizeAndDownloadAll()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                Normalizing…
              </>
            ) : items.length > 1 ? (
              "Batch Normalize & Download"
            ) : (
              "Normalize & Download"
            )}
          </button>
        </div>
      ) : null}

      {phase === "loading" || phase === "processing" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Normalization progress
        </p>
      ) : null}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-emerald-400">
            {result.successes.length} file{result.successes.length === 1 ? "" : "s"} normalized
            {result.failures.length
              ? ` · ${result.failures.length} failed (see list above)`
              : ""}
            .
          </p>
          {result.zipBlob ? (
            <button
              type="button"
              className={toolPrimaryBtn}
              onClick={() => downloadBlob(result.zipBlob!, result.zipFileName)}
            >
              <Download className="mr-2 inline h-4 w-4" aria-hidden />
              Download again
            </button>
          ) : null}
          <PostSuccessUpsell
            operation="audio-normalizer"
            fileContext={
              result.successes.length === 1
                ? result.successes[0].sourceName
                : `${result.successes.length} files`
            }
          />
        </div>
      ) : null}
    </div>
  );
}
