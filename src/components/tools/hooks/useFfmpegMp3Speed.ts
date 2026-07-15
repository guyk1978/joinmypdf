"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  changeAudioSpeed,
  speedChangedOutputFileName,
} from "@/components/tools/ffmpeg/change-mp3-speed";
import {
  formatFfmpegLoadError,
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";

export type FfmpegMp3SpeedResult = {
  blob: Blob;
  fileName: string;
  speed: number;
  maintainPitch: boolean;
};

export type ChangeMp3SpeedParams = {
  file: File;
  speed: number;
  maintainPitch?: boolean;
};

export type UseFfmpegMp3SpeedOptions = {
  onComplete?: (result: FfmpegMp3SpeedResult) => void;
};

export function useFfmpegMp3Speed(options: UseFfmpegMp3SpeedOptions = {}) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FfmpegMp3SpeedResult | null>(null);

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

  const changeSpeed = useCallback(
    async ({ file, speed, maintainPitch = true }: ChangeMp3SpeedParams) => {
      const env = getFfmpegEnvironmentStatus();
      setEnvironment(env);

      if (!env.canRun) {
        const message =
          env.blockingMessage ?? "This browser cannot run local audio speed changes.";
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
        const blob = await changeAudioSpeed(file, {
          speed,
          maintainPitch,
          onPhase: (nextPhase) => {
            setPhase(nextPhase);
            setStatusMessage(
              nextPhase === "loading"
                ? "Loading FFmpeg engine…"
                : maintainPitch
                  ? "Time-stretching (atempo)…"
                  : "Applying rate change…",
            );
          },
          onProgress: (progress) => {
            setPhase("processing");
            setRatio(progress);
          },
        });

        const fileName = speedChangedOutputFileName(file.name, speed);
        const payload: FfmpegMp3SpeedResult = { blob, fileName, speed, maintainPitch };
        setResult(payload);
        setPhase("success");
        setRatio(1);
        setStatusMessage("Speed change complete.");
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
    changeSpeed,
    reset,
  };
}
