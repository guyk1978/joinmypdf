"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaProcessingPhase } from "@/services/media";
import {
  editMp3MetadataFile,
  metadataOutputFileName,
  type Mp3MetadataFields,
} from "@/components/tools/ffmpeg/edit-mp3-metadata";
import {
  formatFfmpegLoadError,
  getFfmpegEnvironmentStatus,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";

export type FfmpegMp3MetadataResult = {
  blob: Blob;
  fileName: string;
};

export type SaveMp3MetadataParams = {
  file: File;
  fields: Mp3MetadataFields;
  coverFile?: File | null;
  removeCover?: boolean;
};

export type UseFfmpegMp3MetadataOptions = {
  onComplete?: (result: FfmpegMp3MetadataResult) => void;
};

export function useFfmpegMp3Metadata(options: UseFfmpegMp3MetadataOptions = {}) {
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [environment, setEnvironment] = useState<FfmpegEnvironmentStatus | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FfmpegMp3MetadataResult | null>(null);

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

  const saveMetadata = useCallback(async (params: SaveMp3MetadataParams) => {
    const env = getFfmpegEnvironmentStatus();
    setEnvironment(env);

    if (!env.canRun) {
      const message = env.blockingMessage ?? "This browser cannot run local MP3 metadata editing.";
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
      const blob = await editMp3MetadataFile(params.file, {
        fields: params.fields,
        coverFile: params.coverFile,
        removeCover: params.removeCover,
        onPhase: (nextPhase) => {
          setPhase(nextPhase);
          setStatusMessage(
            nextPhase === "loading" ? "Loading FFmpeg engine…" : "Writing ID3 metadata…",
          );
        },
        onProgress: (progress) => {
          setPhase("processing");
          setRatio(progress);
        },
      });

      const fileName = metadataOutputFileName(params.file.name);
      const payload = { blob, fileName };
      setResult(payload);
      setPhase("success");
      setRatio(1);
      setStatusMessage("Metadata saved.");
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
    saveMetadata,
    reset,
  };
}
