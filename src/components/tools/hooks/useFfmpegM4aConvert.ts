"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  convertM4aFile,
  formatM4aConversionError,
  m4aOutputFileName,
  m4aOutputFormatLabel,
  type M4aOutputFormat,
} from "@/components/tools/ffmpeg/convert-m4a";
import {
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";

export type FfmpegM4aConvertResult = {
  blob: Blob;
  fileName: string;
  outputFormat: M4aOutputFormat;
};

export type UseFfmpegM4aConvertOptions = {
  onComplete?: (result: FfmpegM4aConvertResult) => void;
};

export function useFfmpegM4aConvert(options: UseFfmpegM4aConvertOptions = {}) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FfmpegM4aConvertResult | null>(null);

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

  const convert = useCallback(async (file: File, outputFormat: M4aOutputFormat) => {
    const env = getFfmpegEnvironmentStatus();
    setEnvironment(env);

    if (!env.canRun) {
      const message = env.blockingMessage ?? "This browser cannot run local audio conversion.";
      setPhase("error");
      setError(message);
      setStatusMessage(message);
      return null;
    }

    const formatLabel = m4aOutputFormatLabel(outputFormat);

    setBusy(true);
    setError("");
    setResult(null);
    setPhase("loading");
    setRatio(0);
    setStatusMessage("Validating M4A/AAC file…");

    try {
      const blob = await convertM4aFile(file, {
        outputFormat,
        onPhase: (nextPhase) => {
          if (nextPhase === "validating") {
            setPhase("loading");
            setStatusMessage("Validating M4A/AAC file…");
          } else if (nextPhase === "loading") {
            setPhase("loading");
            setStatusMessage("Loading FFmpeg engine…");
          } else {
            setPhase("processing");
            setStatusMessage(`Converting M4A to ${formatLabel}…`);
          }
        },
        onProgress: (progress) => {
          setPhase("processing");
          setRatio(progress);
        },
      });

      const fileName = m4aOutputFileName(file.name, outputFormat);
      const payload: FfmpegM4aConvertResult = { blob, fileName, outputFormat };
      setResult(payload);
      setPhase("success");
      setRatio(1);
      setStatusMessage(`Conversion complete — ${formatLabel} ready to download.`);
      onCompleteRef.current?.(payload);
      return payload;
    } catch (cause) {
      const message = formatM4aConversionError(cause, outputFormat);
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
