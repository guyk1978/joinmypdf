"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  formatFfmpegLoadError,
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";
import { mp3TrimOutputFileName, trimMp3File } from "@/components/tools/ffmpeg/trim-mp3";

export type FfmpegAudioTrimResult = {
  blob: Blob;
  fileName: string;
};

export type TrimMp3Params = {
  file: File;
  startSeconds: number;
  endSeconds: number;
};

export type UseFfmpegAudioTrimOptions = {
  onComplete?: (result: FfmpegAudioTrimResult) => void;
};

export function useFfmpegAudioTrim(options: UseFfmpegAudioTrimOptions = {}) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FfmpegAudioTrimResult | null>(null);

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

  const trim = useCallback(async ({ file, startSeconds, endSeconds }: TrimMp3Params) => {
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
      const blob = await trimMp3File(file, {
        startSeconds,
        endSeconds,
        onPhase: (nextPhase) => {
          setPhase(nextPhase);
          setStatusMessage(nextPhase === "loading" ? "Loading FFmpeg engine…" : "Trimming audio…");
        },
        onProgress: (progress) => {
          setPhase("processing");
          setRatio(progress);
        },
      });

      const fileName = mp3TrimOutputFileName(file.name);
      const payload = { blob, fileName };
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
