"use client";

import { clsx } from "clsx";
import { Download, Eraser, Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  formatSupportsLabel,
  IndustrialMatteDropzone,
} from "@/components/IndustrialMatteDropzone";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";
import {
  DEFAULT_MIN_SILENCE,
  DEFAULT_THRESHOLD_DB,
  MAX_MIN_SILENCE,
  MAX_THRESHOLD_DB,
  MIN_MIN_SILENCE,
  MIN_THRESHOLD_DB,
  analyzeSilence,
  cleanedOutputFileName,
  decodeAudioFile,
  encodeWavBlob,
  formatDurationLabel,
  isSupportedSilenceFile,
  stitchKeepSegments,
  type SilenceAnalysis,
} from "@/lib/remove-silence";

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

type SilencePreviewProps = {
  analysis: SilenceAnalysis | null;
  analyzing: boolean;
};

function SilencePreview({ analysis, analyzing }: SilencePreviewProps) {
  return (
    <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Silence map
        </p>
        {analysis ? (
          <p className="font-mono text-xs text-neutral-500">
            Cut {formatDurationLabel(analysis.silenceSeconds)} · Keep{" "}
            {formatDurationLabel(analysis.keepSeconds)}
          </p>
        ) : null}
      </div>

      {analyzing ? (
        <p className="text-xs text-neutral-500">Analyzing RMS amplitude locally…</p>
      ) : !analysis ? (
        <p className="text-xs text-neutral-500">
          Upload audio to preview detected silence before cutting.
        </p>
      ) : (
        <div
          className="silence-remover-tool__map relative flex h-20 w-full items-end gap-px overflow-hidden"
          aria-hidden
        >
          {analysis.envelope.map((value, index) => {
            const silent = analysis.silentFlags[index];
            return (
              <span
                key={index}
                className={clsx(
                  "min-w-0 flex-1",
                  silent ? "bg-red-500/55" : "bg-neutral-500/70",
                )}
                style={{ height: `${Math.max(6, value * 100)}%` }}
                title={silent ? "Silence (will remove)" : "Audio (keep)"}
              />
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-[0.6875rem] uppercase tracking-wide text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 bg-neutral-500" /> Keep
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 bg-red-500/70" /> Silence cut
        </span>
      </div>
    </div>
  );
}

export type SilenceRemoverResult = {
  blob: Blob;
  fileName: string;
  silenceSeconds: number;
  keepSeconds: number;
};

export type SilenceRemoverProps = ToolModuleProps & {
  onComplete?: (result: SilenceRemoverResult) => void;
};

export function SilenceRemover({ title, onComplete }: SilenceRemoverProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const thresholdId = useId();
  const minDurId = useId();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thresholdDb, setThresholdDb] = useState(DEFAULT_THRESHOLD_DB);
  const [minSilence, setMinSilence] = useState(DEFAULT_MIN_SILENCE);
  const [analysis, setAnalysis] = useState<SilenceAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<SilenceRemoverResult | null>(null);

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
    if (!file) {
      bufferRef.current = null;
      setAnalysis(null);
      setAnalyzing(false);
      return;
    }

    let cancelled = false;
    setAnalyzing(true);
    setError("");
    setResult(null);
    setProgress(0.05);

    void (async () => {
      try {
        let buffer = bufferRef.current;
        if (!buffer) {
          setStatusMessage("Decoding audio…");
          buffer = await decodeAudioFile(file);
          if (cancelled) return;
          bufferRef.current = buffer;
        }

        setStatusMessage("Scanning RMS silence…");
        const next = await analyzeSilence(buffer, {
          thresholdDb,
          minSilenceSeconds: minSilence,
          onProgress: (ratio) => {
            if (!cancelled) setProgress(0.1 + ratio * 0.85);
          },
        });
        if (cancelled) return;
        setAnalysis(next);
        setProgress(1);
        setStatusMessage(
          next.silenceSegments.length
            ? `Found ${next.silenceSegments.length} silence region${next.silenceSegments.length === 1 ? "" : "s"}.`
            : "No removable silence at these settings.",
        );
      } catch (cause) {
        if (cancelled) return;
        bufferRef.current = null;
        setAnalysis(null);
        setError(cause instanceof Error ? cause.message : "Analysis failed.");
        setStatusMessage("");
      } finally {
        if (!cancelled) setAnalyzing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, thresholdDb, minSilence]);

  const pickFile = useCallback((next: File) => {
    if (!isSupportedSilenceFile(next)) {
      setError(`Invalid file "${next.name}". Please upload MP3, WAV, AAC, or OGG.`);
      return;
    }
    bufferRef.current = null;
    setFile(next);
    setError("");
    setResult(null);
  }, []);

  const removeSilenceAndDownload = useCallback(async () => {
    if (!file || !bufferRef.current || !analysis || busy || analyzing) return;
    if (analysis.keepSegments.length === 0) {
      setError("Nothing left to keep at these settings. Raise the threshold or min duration.");
      return;
    }

    setBusy(true);
    setError("");
    setStatusMessage("Stitching audible segments…");
    setProgress(0.2);

    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      const stitched = stitchKeepSegments(bufferRef.current, analysis.keepSegments);
      setProgress(0.7);
      setStatusMessage("Encoding WAV…");
      const blob = encodeWavBlob(stitched);
      const fileName = cleanedOutputFileName(file.name);
      const payload: SilenceRemoverResult = {
        blob,
        fileName,
        silenceSeconds: analysis.silenceSeconds,
        keepSeconds: analysis.keepSeconds,
      };
      setResult(payload);
      setProgress(1);
      setStatusMessage("Silence removed — download ready.");
      downloadBlob(blob, fileName);
      onComplete?.(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove silence.");
      setStatusMessage("");
    } finally {
      setBusy(false);
    }
  }, [analysis, analyzing, busy, file, onComplete]);

  const canProcess =
    Boolean(file) &&
    Boolean(analysis) &&
    analysis!.keepSegments.length > 0 &&
    !busy &&
    !analyzing;

  const isDisabled = busy;

  return (
    <div className="silence-remover-tool space-y-4">
      <p className="text-sm leading-relaxed text-neutral-400">
        {title ??
          "Remove silence from audio online — auto-trim dead air from podcasts and meetings. 100% private Web Audio processing."}{" "}
        Set a dB threshold and minimum gap, preview cuts in red, then Remove Silence &amp; Download.
        Nothing is uploaded.
      </p>

      {error ? (
        <div
          className="rounded-none border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!file ? (
        <IndustrialMatteDropzone
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          aria-disabled={isDisabled}
          active={dragActive}
          disabled={isDisabled}
          dropTitle="Drop an audio file"
          selectLabel="Select audio from device"
          supportsLabel={formatSupportsLabel(["MP3", "WAV", "AAC", "M4A", "OGG"])}
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
            const next = event.dataTransfer.files[0];
            if (next) pickFile(next);
          }}
          onClick={() => {
            if (!isDisabled) inputRef.current?.click();
          }}
          input={
            <input
              ref={inputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.oga,.aac,.m4a,.flac"
              disabled={isDisabled}
              className="sr-only"
              onChange={(event) => {
                const next = event.target.files?.[0];
                if (next) pickFile(next);
                event.target.value = "";
              }}
            />
          }
        />
      ) : (
        <div className="space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a]/90 p-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-neutral-200">
              {file.name} · {formatBytes(file.size)}
              {analysis ? ` · ${formatDurationLabel(analysis.duration)}` : null}
            </p>
            <button
              type="button"
              className={toolOutlineBtn}
              disabled={busy}
              onClick={() => {
                setFile(null);
                setError("");
                setResult(null);
                setAnalysis(null);
                bufferRef.current = null;
              }}
            >
              Choose another file
            </button>
          </div>

          {previewUrl ? (
            <audio src={previewUrl} controls preload="metadata" className="w-full" />
          ) : null}

          <SilencePreview analysis={analysis} analyzing={analyzing} />

          <fieldset className="space-y-4 border border-neutral-800 bg-neutral-950 p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Detection settings
            </legend>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm text-neutral-300" htmlFor={thresholdId}>
                  Silence threshold
                </label>
                <span className="font-mono text-sm text-neutral-100">{thresholdDb} dB</span>
              </div>
              <input
                id={thresholdId}
                type="range"
                min={MIN_THRESHOLD_DB}
                max={MAX_THRESHOLD_DB}
                step={1}
                value={thresholdDb}
                disabled={busy || analyzing}
                onChange={(event) => setThresholdDb(Number(event.target.value))}
                className="w-full accent-neutral-200"
              />
              <p className="text-xs text-neutral-500">
                Louder threshold (−20) marks more as silence; quieter (−60) only cuts near-digital
                silence. −40 dB suits most podcasts.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm text-neutral-300" htmlFor={minDurId}>
                  Minimum duration
                </label>
                <span className="font-mono text-sm text-neutral-100">
                  {minSilence.toFixed(1)} s
                </span>
              </div>
              <input
                id={minDurId}
                type="range"
                min={MIN_MIN_SILENCE}
                max={MAX_MIN_SILENCE}
                step={0.1}
                value={minSilence}
                disabled={busy || analyzing}
                onChange={(event) => setMinSilence(Number(event.target.value))}
                className="w-full accent-neutral-200"
              />
              <p className="text-xs text-neutral-500">
                Only gaps at least this long are removed — protects short pauses inside words.
              </p>
            </div>
          </fieldset>

          {(analyzing || busy) && statusMessage ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {analyzing ? "Analysis" : "Processing"}
              </p>
              <div className="h-1.5 w-full bg-neutral-900">
                <div
                  className="h-full bg-neutral-300 transition-[width] duration-200"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="text-xs text-neutral-500">{statusMessage}</p>
            </div>
          ) : statusMessage && analysis ? (
            <p className="text-xs text-neutral-500">{statusMessage}</p>
          ) : null}

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canProcess}
            onClick={() => void removeSilenceAndDownload()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                Removing silence…
              </>
            ) : (
              <>
                <Eraser className="mr-2 inline h-4 w-4" aria-hidden />
                Remove Silence &amp; Download
              </>
            )}
          </button>
        </div>
      )}

      {result ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-emerald-400">
            Removed {formatDurationLabel(result.silenceSeconds)} of silence · kept{" "}
            {formatDurationLabel(result.keepSeconds)} ({formatBytes(result.blob.size)} WAV).
          </p>
          <button
            type="button"
            className={toolPrimaryBtn}
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            Download again
          </button>
          <PostSuccessUpsell
            operation="silence-remover"
            fileContext={file?.name}
            sourceFile={file}
          />
        </div>
      ) : null}
    </div>
  );
}
