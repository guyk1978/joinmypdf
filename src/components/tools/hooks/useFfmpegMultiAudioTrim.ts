"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  formatFfmpegLoadError,
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";
import { trimAudioFile } from "@/components/tools/ffmpeg/trim-audio";

export type FfmpegMultiAudioTrimResult = {
  blob: Blob;
  fileName: string;
};

export type TrimAudioParams = {
  file: File;
  startSeconds: number;
  endSeconds: number;
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
};

export type UseFfmpegMultiAudioTrimOptions = {
  onComplete?: (result: FfmpegMultiAudioTrimResult) => void;
};

export function useFfmpegMultiAudioTrim(options: UseFfmpegMultiAudioTrimOptions = {}) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FfmpegMultiAudioTrimResult | null>(null);

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

  const trim = useCallback(async (params: TrimAudioParams) => {
    const env = getFfmpegEnvironmentStatus();
    setEnvironment(env);

    if (!env.canRun) {
      const message = env.blockingMessage ?? "This browser cannot run local audio trimming.";
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
    setStatusMessage("Loading FFmpeg engine…");

    try {
      const payload = await trimAudioFile(params.file, {
        startSeconds: params.startSeconds,
        endSeconds: params.endSeconds,
        fadeInSeconds: params.fadeInSeconds,
        fadeOutSeconds: params.fadeOutSeconds,
        onPhase: (nextPhase) => {
          setPhase(nextPhase);
          setStatusMessage(nextPhase === "loading" ? "Loading FFmpeg engine…" : "Trimming audio…");
        },
        onProgress: (progress) => {
          setPhase("processing");
          setRatio(progress);
        },
      });

      setResult(payload);
      setPhase("success");
      setRatio(1);
      setStatusMessage("Trim complete.");
      onCompleteRef.current?.(payload);
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
  }, []);

  return {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    result,
    trim,
    reset,
  };
}
