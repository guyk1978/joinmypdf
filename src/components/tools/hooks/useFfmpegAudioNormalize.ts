"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  analyzeAmplitude,
  normalizeAudioFile,
  normalizedBatchDownloadName,
  normalizedBatchZip,
  normalizedOutputFileName,
  peakGainToTarget,
  type NormalizeAudioOptions,
  type NormalizedBatchOutput,
} from "@/components/tools/ffmpeg/normalize-audio";
import {
  formatFfmpegLoadError,
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";

export type NormalizedFileResult = {
  fileName: string;
  blob: Blob;
  sourceName: string;
};

export type BatchNormalizeFailure = {
  sourceName: string;
  message: string;
};

export type FfmpegAudioNormalizeBatchResult = {
  successes: NormalizedFileResult[];
  failures: BatchNormalizeFailure[];
  zipBlob: Blob | null;
  zipFileName: string;
};

export type UseFfmpegAudioNormalizeOptions = {
  onComplete?: (result: FfmpegAudioNormalizeBatchResult) => void;
};

export function useFfmpegAudioNormalize(options: UseFfmpegAudioNormalizeOptions = {}) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [result, setResult] = useState<FfmpegAudioNormalizeBatchResult | null>(null);

  useEffect(() => {
    setEnvironment(getFfmpegEnvironmentStatus());
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setPhase("idle");
    setRatio(0);
    setStatusMessage("");
    setError("");
    setCurrentIndex(0);
    setTotalCount(0);
    setCurrentFileName(null);
  }, []);

  const normalizeBatch = useCallback(
    async (files: File[], processOptions: NormalizeAudioOptions = {}) => {
      const env = getFfmpegEnvironmentStatus();
      setEnvironment(env);

      if (!env.canRun) {
        const message = env.blockingMessage ?? "This browser cannot run local audio normalization.";
        setPhase("error");
        setError(message);
        setStatusMessage(message);
        return null;
      }

      if (files.length === 0) {
        const message = "Add at least one MP3 or WAV file to normalize.";
        setPhase("error");
        setError(message);
        setStatusMessage(message);
        return null;
      }

      setBusy(true);
      setError("");
      setResult(null);
      setPhase("loading");
      setRatio(0);
      setTotalCount(files.length);
      setCurrentIndex(0);
      setStatusMessage("Loading FFmpeg engine…");

      const successes: NormalizedFileResult[] = [];
      const failures: BatchNormalizeFailure[] = [];
      let ffmpegLoaded = false;
      const mode = processOptions.mode ?? "loudnorm";

      try {
        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          setCurrentIndex(index + 1);
          setCurrentFileName(file.name);
          setPhase(ffmpegLoaded ? "processing" : "loading");
          setStatusMessage(`Normalizing ${index + 1} of ${files.length}: ${file.name}`);

          try {
            let peakGainDb = processOptions.peakGainDb;
            if (mode === "peak" && peakGainDb === undefined) {
              const analysis = await analyzeAmplitude(file);
              peakGainDb = peakGainToTarget(analysis.peakDb);
            }

            const blob = await normalizeAudioFile(file, {
              ...processOptions,
              mode,
              peakGainDb,
              onPhase: (nextPhase) => {
                if (nextPhase === "loading") {
                  setPhase("loading");
                } else {
                  ffmpegLoaded = true;
                  setPhase("processing");
                }
              },
              onProgress: (progress) => {
                const batchRatio = (index + progress) / files.length;
                setRatio(batchRatio);
              },
            });

            ffmpegLoaded = true;
            const fileName = normalizedOutputFileName(file.name);
            successes.push({ fileName, blob, sourceName: file.name });
          } catch (cause) {
            ffmpegLoaded = true;
            failures.push({
              sourceName: file.name,
              message: formatFfmpegLoadError(cause),
            });
          }

          setRatio((index + 1) / files.length);
        }

        let zipBlob: Blob | null = null;
        if (successes.length > 0) {
          const outputs: NormalizedBatchOutput[] = successes.map((item) => ({
            fileName: item.fileName,
            blob: item.blob,
          }));
          if (outputs.length === 1) {
            const single = outputs[0]!;
            zipBlob = single.blob;
          } else {
            zipBlob = await normalizedBatchZip(outputs);
          }
        }

        const zipFileName =
          successes.length === 1
            ? successes[0]!.fileName
            : normalizedBatchDownloadName(successes.length);
        const payload: FfmpegAudioNormalizeBatchResult = {
          successes,
          failures,
          zipBlob,
          zipFileName,
        };

        setResult(payload);
        if (successes.length === 0) {
          setPhase("error");
          setError("No files were normalized. Check the errors below and try again.");
          setStatusMessage("Batch normalization failed.");
        } else {
          setPhase("success");
          setRatio(1);
          setStatusMessage(
            failures.length
              ? `Normalized ${successes.length} of ${files.length} files.`
              : `Normalized ${successes.length} file${successes.length === 1 ? "" : "s"}.`,
          );
          onCompleteRef.current?.(payload);
        }

        return payload;
      } catch (cause) {
        const message = formatFfmpegLoadError(cause);
        setPhase("error");
        setRatio(0);
        setStatusMessage(message);
        setError(message);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return {
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
  };
}
