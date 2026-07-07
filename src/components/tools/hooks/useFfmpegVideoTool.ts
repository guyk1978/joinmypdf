"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";
import { formatVideoFfmpegError } from "@/components/tools/ffmpeg/video-ffmpeg-base";

export type VideoToolResult = {
  blob: Blob;
  fileName: string;
};

type ProcessorCallbacks = {
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

export type UseFfmpegVideoToolOptions<TOptions> = {
  onComplete?: (result: VideoToolResult) => void;
  processor: (
    file: File,
    options: TOptions,
    callbacks: ProcessorCallbacks,
  ) => Promise<Blob>;
  resolveFileName: (file: File, options: TOptions) => string;
  formatError?: (error: unknown) => string;
};

export function useFfmpegVideoTool<TOptions>(options: UseFfmpegVideoToolOptions<TOptions>) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;
  const processorRef = useRef(options.processor);
  processorRef.current = options.processor;
  const resolveFileNameRef = useRef(options.resolveFileName);
  resolveFileNameRef.current = options.resolveFileName;
  const formatErrorRef = useRef(options.formatError ?? formatVideoFfmpegError);
  formatErrorRef.current = options.formatError ?? formatVideoFfmpegError;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VideoToolResult | null>(null);

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

  const process = useCallback(async (file: File, toolOptions: TOptions) => {
    const env = getFfmpegEnvironmentStatus();
    setEnvironment(env);

    if (!env.canRun) {
      const message = env.blockingMessage ?? "This browser cannot run local video processing.";
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
      const blob = await processorRef.current(file, toolOptions, {
        onPhase: (nextPhase) => {
          if (nextPhase === "loading") {
            setPhase("loading");
            setStatusMessage("Loading FFmpeg engine…");
          } else {
            setPhase("processing");
          }
        },
        onProgress: (progress) => {
          setPhase("processing");
          setRatio(progress);
        },
      });

      const fileName = resolveFileNameRef.current(file, toolOptions);
      const payload = { blob, fileName };
      setResult(payload);
      setPhase("success");
      setRatio(1);
      setStatusMessage("Processing complete — download started.");
      onCompleteRef.current?.(payload);
      return payload;
    } catch (cause) {
      const message = formatErrorRef.current(cause);
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
    process,
    reset,
  };
}
