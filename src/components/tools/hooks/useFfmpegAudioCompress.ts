"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  compressAudioFile,
  compressedOutputFileName,
} from "@/components/tools/ffmpeg/compress-audio";
import {
  formatFfmpegLoadError,
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";

export type FfmpegAudioCompressResult = {
  blob: Blob;
  fileName: string;
  originalBytes: number;
  compressedBytes: number;
};

export type UseFfmpegAudioCompressOptions = {
  onComplete?: (result: FfmpegAudioCompressResult) => void;
};

export function useFfmpegAudioCompress(options: UseFfmpegAudioCompressOptions = {}) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FfmpegAudioCompressResult | null>(null);

  useEffect(() => {
    setEnvironment(getFfmpegEnvironmentStatus());
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setPhase("idle");
    setRatio(0);
    setStatusMessage("");
    setError("");
  }, []);

  const compress = useCallback(async (file: File, bitrateKbps: number) => {
    const env = getFfmpegEnvironmentStatus();
    setEnvironment(env);

    if (!env.canRun) {
      const message = env.blockingMessage ?? "This browser cannot run local audio compression.";
      setPhase("error");
      setError(message);
      setStatusMessage(message);
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);
    setPhase("loading");
    setRatio(0);
    setStatusMessage("Loading FFmpeg engine…");

    try {
      const blob = await compressAudioFile(file, {
        bitrateKbps,
        onPhase: (nextPhase) => {
          setPhase(nextPhase);
          setStatusMessage(
            nextPhase === "loading" ? "Loading FFmpeg engine…" : "Compression progress…",
          );
        },
        onProgress: (progress) => {
          setPhase("processing");
          setStatusMessage("Compression progress…");
          setRatio(progress);
        },
      });

      const fileName = compressedOutputFileName(file.name);
      const payload: FfmpegAudioCompressResult = {
        blob,
        fileName,
        originalBytes: file.size,
        compressedBytes: blob.size,
      };
      setResult(payload);
      setPhase("success");
      setRatio(1);
      setStatusMessage("Compression complete.");
      onCompleteRef.current?.(payload);
      return payload;
    } catch (cause) {
      const message = formatFfmpegLoadError(cause);
      setPhase("error");
      setRatio(0);
      setStatusMessage(message);
      setError(message);
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    result,
    compress,
    reset,
  };
}
