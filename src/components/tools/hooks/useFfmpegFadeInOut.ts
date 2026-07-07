"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  applyFadeInOut,
  fadedOutputFileName,
  type FadeDurations,
} from "@/components/tools/ffmpeg/fade-audio";
import {
  formatFfmpegLoadError,
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";

export type FfmpegFadeResult = {
  blob: Blob;
  fileName: string;
  fadeInSeconds: number;
  fadeOutSeconds: number;
};

export type ApplyFadeParams = FadeDurations & {
  file: File;
  audioDurationSeconds: number;
};

export type UseFfmpegFadeInOutOptions = {
  onComplete?: (result: FfmpegFadeResult) => void;
};

export function useFfmpegFadeInOut(options: UseFfmpegFadeInOutOptions = {}) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FfmpegFadeResult | null>(null);

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

  const applyFade = useCallback(async (params: ApplyFadeParams) => {
    const env = getFfmpegEnvironmentStatus();
    setEnvironment(env);

    if (!env.canRun) {
      const message = env.blockingMessage ?? "This browser cannot run local fade processing.";
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
      const blob = await applyFadeInOut(params.file, {
        fadeInSeconds: params.fadeInSeconds,
        fadeOutSeconds: params.fadeOutSeconds,
        audioDurationSeconds: params.audioDurationSeconds,
        onPhase: (nextPhase) => {
          setPhase(nextPhase);
          setStatusMessage(
            nextPhase === "loading" ? "Loading FFmpeg engine…" : "Applying fade effects…",
          );
        },
        onProgress: (progress) => {
          setPhase("processing");
          setRatio(progress);
        },
      });

      const fileName = fadedOutputFileName(params.file.name);
      const payload: FfmpegFadeResult = {
        blob,
        fileName,
        fadeInSeconds: params.fadeInSeconds,
        fadeOutSeconds: params.fadeOutSeconds,
      };
      setResult(payload);
      setPhase("success");
      setRatio(1);
      setStatusMessage("Fade effects applied.");
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
    applyFade,
    reset,
  };
}
