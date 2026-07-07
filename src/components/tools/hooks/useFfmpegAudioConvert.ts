"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  convertAudioFileToMp3,
  mp3OutputFileName,
} from "@/components/tools/ffmpeg/convert-to-mp3";
import {
  formatFfmpegLoadError,
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";

export type FfmpegAudioConvertResult = {
  blob: Blob;
  fileName: string;
};

export type UseFfmpegAudioConvertOptions = {
  onComplete?: (result: FfmpegAudioConvertResult) => void;
};

export function useFfmpegAudioConvert(options: UseFfmpegAudioConvertOptions = {}) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FfmpegAudioConvertResult | null>(null);

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

  const convert = useCallback(
    async (file: File, bitrateKbps: number) => {
      const env = getFfmpegEnvironmentStatus();
      setEnvironment(env);

      if (!env.canRun) {
        const message = env.blockingMessage ?? "This browser cannot run local audio conversion.";
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
        const blob = await convertAudioFileToMp3(file, {
          bitrateKbps,
          onPhase: (nextPhase) => {
            setPhase(nextPhase);
            setStatusMessage(
              nextPhase === "loading" ? "Loading FFmpeg engine…" : "Converting audio…",
            );
          },
          onProgress: (progress) => {
            setPhase("processing");
            setRatio(progress);
          },
        });

        const fileName = mp3OutputFileName(file.name);
        const payload = { blob, fileName };
        setResult(payload);
        setPhase("success");
        setRatio(1);
        setStatusMessage("Conversion complete.");
        onCompleteRef.current?.(payload);
      } catch (cause) {
        const message = formatFfmpegLoadError(cause);
        setPhase("error");
        setRatio(0);
        setStatusMessage(message);
        setError(message);
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
    result,
    convert,
    reset,
  };
}
