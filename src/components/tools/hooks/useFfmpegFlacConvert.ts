"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  convertFlacFile,
  flacOutputFileName,
  flacOutputFormatLabel,
  formatFlacConversionError,
  type FlacOutputFormat,
} from "@/components/tools/ffmpeg/convert-flac";
import {
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";

export type FfmpegFlacConvertResult = {
  blob: Blob;
  fileName: string;
  outputFormat: FlacOutputFormat;
};

export type UseFfmpegFlacConvertOptions = {
  onComplete?: (result: FfmpegFlacConvertResult) => void;
};

export function useFfmpegFlacConvert(options: UseFfmpegFlacConvertOptions = {}) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FfmpegFlacConvertResult | null>(null);

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

  const convert = useCallback(async (file: File, outputFormat: FlacOutputFormat) => {
    const env = getFfmpegEnvironmentStatus();
    setEnvironment(env);

    if (!env.canRun) {
      const message = env.blockingMessage ?? "This browser cannot run local audio conversion.";
      setPhase("error");
      setError(message);
      setStatusMessage(message);
      return null;
    }

    const formatLabel = flacOutputFormatLabel(outputFormat);

    setBusy(true);
    setError("");
    setResult(null);
    setPhase("loading");
    setRatio(0);
    setStatusMessage("Validating FLAC file…");

    try {
      const blob = await convertFlacFile(file, {
        outputFormat,
        onPhase: (nextPhase) => {
          if (nextPhase === "validating") {
            setPhase("loading");
            setStatusMessage("Validating FLAC file…");
          } else if (nextPhase === "loading") {
            setPhase("loading");
            setStatusMessage("Loading FFmpeg engine…");
          } else {
            setPhase("processing");
            setStatusMessage(`Transcoding FLAC to ${formatLabel}…`);
          }
        },
        onProgress: (progress) => {
          setPhase("processing");
          setRatio(progress);
        },
      });

      const fileName = flacOutputFileName(file.name, outputFormat);
      const payload: FfmpegFlacConvertResult = { blob, fileName, outputFormat };
      setResult(payload);
      setPhase("success");
      setRatio(1);
      setStatusMessage(`Conversion complete — ${formatLabel} ready to download.`);
      onCompleteRef.current?.(payload);
      return payload;
    } catch (cause) {
      const message = formatFlacConversionError(cause, outputFormat);
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
