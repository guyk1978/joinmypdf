"use client";

import { clsx } from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import {
  bootstrapMediaTools,
  getVideoManager,
  type MediaProcessingPhase,
  type MediaProgress,
} from "@/services/media";
import {
  downloadVideoBlob,
  isAcceptedVideoFile,
  videoToMp4OutputName,
  VIDEO_TO_MP4_ACCEPT,
} from "@/lib/video-to-mp4";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";

export type VideoToMp4Labels = {
  dropTitle: string;
  dropTitleBusy: string;
  dropDescription: string;
  privacyBadge: string;
  formatsHint: string;
  selectLabel: string;
  invalidFile: string;
  statusLoading: string;
  statusProcessing: string;
  statusSuccess: string;
  statusError: string;
  convertAnother: string;
  fileReady: string;
  codecCopy: string;
  codecEncode: string;
};

export type VideoToMp4Props = {
  labels: VideoToMp4Labels;
  className?: string;
  onStart?: () => void;
  onComplete?: (blob: Blob, filename: string) => void;
};

export function VideoToMp4({ labels, className, onStart, onComplete }: VideoToMp4Props) {
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [codecNote, setCodecNote] = useState("");
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    bootstrapMediaTools();
    return () => {
      unsubRef.current?.();
    };
  }, []);

  const reset = useCallback(() => {
    unsubRef.current?.();
    unsubRef.current = null;
    registerFile(null);
    setFile(null);
    setPhase("idle");
    setRatio(0);
    setStatusMessage("");
    setError("");
    setBusy(false);
    setCodecNote("");
  }, [registerFile]);

  const onProgress = useCallback(
    (progress: MediaProgress) => {
      setPhase(progress.phase);
      setRatio(progress.ratio);
      if (progress.message) setStatusMessage(progress.message);
    },
    [],
  );

  const convertFile = useCallback(
    async (next: File) => {
      if (!isAcceptedVideoFile(next)) {
        setError(labels.invalidFile);
        return;
      }

      setFile(next);
      setError("");
      setBusy(true);
      setPhase("loading");
      setRatio(0);
      setStatusMessage(labels.statusLoading);
      setCodecNote("");

      const ext = next.name.split(".").pop()?.toLowerCase() ?? "";
      setCodecNote(ext === "mp4" || ext === "m4v" ? labels.codecCopy : labels.codecEncode);

      onStart?.();
      const video = getVideoManager();
      unsubRef.current?.();
      unsubRef.current = video.onProgress(onProgress);

      try {
        const blob = await video.toMp4(next, { preferCopy: true });
        const filename = videoToMp4OutputName(next);
        setPhase("success");
        setRatio(1);
        setStatusMessage(labels.statusSuccess);
        registerFile(next, slug);
        downloadVideoBlob(blob, filename);
        onComplete?.(blob, filename);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : labels.statusError;
        setPhase("error");
        setRatio(0);
        setStatusMessage(message);
        setError(message);
      } finally {
        unsubRef.current?.();
        unsubRef.current = null;
        setBusy(false);
      }
    },
    [labels, onComplete, onProgress, onStart, registerFile, slug],
  );

  const showDropzone = !file || phase === "idle";
  const showStatus = phase !== "idle";

  return (
    <div className={clsx("video-to-mp4-tool space-y-4", className)}>
      {showDropzone ? (
        <MediaDropzone
          mediaKind="video"
          accept={VIDEO_TO_MP4_ACCEPT}
          busy={busy}
          disabled={busy}
          supportedFormats={["MP4", "MOV", "WEBM", "MKV", "AVI"]}
          onFile={(picked) => void convertFile(picked)}
          onError={(message) => setError(message)}
          labels={{
            title: labels.dropTitle,
            titleBusy: labels.dropTitleBusy,
            description: labels.dropDescription,
            privacyBadge: labels.privacyBadge,
            formatsHint: labels.formatsHint,
            selectLabel: labels.selectLabel,
          }}
        />
      ) : null}

      {file && !showDropzone ? (
        <div className="tool-workspace-panel space-y-3">
          <p className="text-sm text-neutral-300">
            <strong className="text-white">{file.name}</strong>
            {codecNote ? ` · ${codecNote}` : null}
          </p>
          {showStatus ? (
            <MediaProcessingStatus
              phase={phase}
              ratio={ratio}
              message={statusMessage || undefined}
            />
          ) : null}
          {!busy && phase === "success" ? (
            <>
              <ToolSuccessEngagement pageTitle={headline} className="!mt-0" />
              <button type="button" className={toolPrimaryBtn} onClick={reset}>
                {labels.convertAnother}
              </button>
            </>
          ) : null}
          {!busy && phase === "error" ? (
            <div className="flex flex-wrap gap-3">
              <button type="button" className={toolPrimaryBtn} onClick={() => void convertFile(file)}>
                {labels.fileReady}
              </button>
              <button type="button" className={toolSecondaryBtn} onClick={reset}>
                {labels.convertAnother}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {error && showDropzone ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
