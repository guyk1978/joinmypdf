"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  createMp4FromMp3AndImage,
  formatMp3ToMp4Error,
  mp3ToMp4OutputFileName,
} from "@/components/tools/ffmpeg/create-mp3-to-mp4";
import {
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";

export type FfmpegMp3ToMp4Result = {
  blob: Blob;
  fileName: string;
};

export type UseFfmpegMp3ToMp4Options = {
  onComplete?: (result: FfmpegMp3ToMp4Result) => void;
};

export function useFfmpegMp3ToMp4(options: UseFfmpegMp3ToMp4Options = {}) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FfmpegMp3ToMp4Result | null>(null);

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

  const create = useCallback(async (mp3File: File, imageFile: File) => {
    const env = getFfmpegEnvironmentStatus();
    setEnvironment(env);

    if (!env.canRun) {
      const message = env.blockingMessage ?? "This browser cannot run local video creation.";
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
    setStatusMessage("Validating MP3 and cover image…");

    try {
      const blob = await createMp4FromMp3AndImage(mp3File, imageFile, {
        onPhase: (nextPhase) => {
          if (nextPhase === "validating") {
            setPhase("loading");
            setStatusMessage("Validating MP3 and cover image…");
          } else if (nextPhase === "loading") {
            setPhase("loading");
            setStatusMessage("Loading FFmpeg engine…");
          } else {
            setPhase("processing");
            setStatusMessage("Creating MP4 video…");
          }
        },
        onProgress: (progress) => {
          setPhase("processing");
          setRatio(progress);
        },
      });

      const fileName = mp3ToMp4OutputFileName(mp3File.name);
      const payload = { blob, fileName };
      setResult(payload);
      setPhase("success");
      setRatio(1);
      setStatusMessage("Video created — MP4 ready to download.");
      onCompleteRef.current?.(payload);
      return payload;
    } catch (cause) {
      const message = formatMp3ToMp4Error(cause);
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
    create,
    reset,
  };
}
