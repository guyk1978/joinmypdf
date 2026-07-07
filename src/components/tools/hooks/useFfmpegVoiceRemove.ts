"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  instrumentalOutputFileName,
  removeVocalsFromAudio,
} from "@/components/tools/ffmpeg/remove-vocals";
import {
  formatFfmpegLoadError,
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";

export type FfmpegVoiceRemoveResult = {
  blob: Blob;
  fileName: string;
};

export type UseFfmpegVoiceRemoveOptions = {
  onComplete?: (result: FfmpegVoiceRemoveResult) => void;
};

export function useFfmpegVoiceRemove(options: UseFfmpegVoiceRemoveOptions = {}) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FfmpegVoiceRemoveResult | null>(null);

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

  const removeVocals = useCallback(async (file: File) => {
    const env = getFfmpegEnvironmentStatus();
    setEnvironment(env);

    if (!env.canRun) {
      const message = env.blockingMessage ?? "This browser cannot run local vocal removal.";
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
      const blob = await removeVocalsFromAudio(file, {
        onPhase: (nextPhase) => {
          setPhase(nextPhase);
          setStatusMessage(
            nextPhase === "loading"
              ? "Loading FFmpeg engine…"
              : "Applying phase-cancellation filter…",
          );
        },
        onProgress: (progress) => {
          setPhase("processing");
          setRatio(progress);
        },
      });

      const fileName = instrumentalOutputFileName(file.name);
      const payload = { blob, fileName };
      setResult(payload);
      setPhase("success");
      setRatio(1);
      setStatusMessage("Instrumental export complete.");
      onCompleteRef.current?.(payload);
      return payload;
    } catch (cause) {
      const message = formatFfmpegLoadError(cause);
      setPhase("error");
      setRatio(0);
      setStatusMessage(message);
      setError(
        message.includes("Invalid") || message.includes("unsupported")
          ? message
          : `${message} Try a stereo MP3 with center-panned vocals, a shorter clip, or a different source mix.`,
      );
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
    removeVocals,
    reset,
  };
}
