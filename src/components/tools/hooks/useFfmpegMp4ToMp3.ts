"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  extractMp3FromMp4,
  formatMp4ToMp3Error,
  mp4ToMp3OutputFileName,
} from "@/components/tools/ffmpeg/convert-mp4-to-mp3";
import {
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";

export type FfmpegMp4ToMp3Result = {
  blob: Blob;
  fileName: string;
};

export type UseFfmpegMp4ToMp3Options = {
  onComplete?: (result: FfmpegMp4ToMp3Result) => void;
};

export function useFfmpegMp4ToMp3(options: UseFfmpegMp4ToMp3Options = {}) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FfmpegMp4ToMp3Result | null>(null);

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

  const convert = useCallback(async (file: File) => {
    const env = getFfmpegEnvironmentStatus();
    setEnvironment(env);

    if (!env.canRun) {
      const message = env.blockingMessage ?? "This browser cannot run local video conversion.";
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
    setStatusMessage("Validating MP4 file…");

    try {
      const blob = await extractMp3FromMp4(file, {
        onPhase: (nextPhase) => {
          if (nextPhase === "validating") {
            setPhase("loading");
            setStatusMessage("Validating MP4 file…");
          } else if (nextPhase === "loading") {
            setPhase("loading");
            setStatusMessage("Loading FFmpeg engine…");
          } else {
            setPhase("processing");
            setStatusMessage("Extracting audio from MP4…");
          }
        },
        onProgress: (progress) => {
          setPhase("processing");
          setRatio(progress);
        },
      });

      const fileName = mp4ToMp3OutputFileName(file.name);
      const payload = { blob, fileName };
      setResult(payload);
      setPhase("success");
      setRatio(1);
      setStatusMessage("Extraction complete — MP3 ready to download.");
      onCompleteRef.current?.(payload);
      return payload;
    } catch (cause) {
      const message = formatMp4ToMp3Error(cause);
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
    convert,
    reset,
  };
}
