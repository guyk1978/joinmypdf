"use client";

import { clsx } from "clsx";
import { AlertTriangle, Download, Loader2, MicOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { isVoiceRemoveInputFile } from "@/components/tools/ffmpeg/remove-vocals";
import {
  useFfmpegVoiceRemove,
  type FfmpegVoiceRemoveResult,
} from "@/components/tools/hooks/useFfmpegVoiceRemove";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const AUDIO_ACCEPT = "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,.mp3,.wav,.m4a";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type VoiceRemoverProps = ToolModuleProps & {
  onComplete?: (result: FfmpegVoiceRemoveResult) => void;
};

export function VoiceRemover({ title, onComplete }: VoiceRemoverProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [instrumentalUrl, setInstrumentalUrl] = useState<string | null>(null);
  const [pickError, setPickError] = useState("");

  const {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    result,
    removeVocals,
    reset,
  } = useFfmpegVoiceRemove({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!result?.blob) {
      setInstrumentalUrl(null);
      return;
    }
    const url = URL.createObjectURL(result.blob);
    setInstrumentalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  const pickFile = useCallback(
    (next: File) => {
      if (!isVoiceRemoveInputFile(next)) {
        setPickError(
          "Invalid or unsupported file. Please upload a stereo MP3, WAV, or M4A track for vocal removal.",
        );
        return;
      }
      setFile(next);
      setPickError("");
      reset();
    },
    [reset],
  );

  const processAndDownload = useCallback(async () => {
    if (!file || busy) return;

    const payload = await removeVocals(file);
    if (payload) {
      downloadBlob(payload.blob, payload.fileName);
    }
  }, [busy, file, removeVocals]);

  const canProcess = Boolean(file) && !busy && environment?.canRun !== false;

  return (
    <div className="voice-remover-tool space-y-4">
      <p className="text-sm leading-relaxed text-neutral-400">
        {title ??
          "Isolate instrumentals by removing vocals from your audio tracks locally. 100% private, no server processing."}{" "}
        This tool uses ffmpeg center-channel phase cancellation—not AI stem separation—so results are
        estimates that work best on stereo mixes with center-panned vocals.
      </p>

      <div className="rounded-none border border-amber-900/50 bg-amber-950/20 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
          <div className="space-y-1 text-sm text-amber-100/90">
            <p className="font-medium text-amber-200">Estimation disclaimer</p>
            <p className="leading-relaxed text-amber-100/80">
              Vocal removal quality depends on how the original track was mixed. Complex productions,
              heavy effects, or vocals panned wide may leave bleed or artifacts. Longer files can take
              several minutes—processing runs in a Web Worker so this page stays responsive.
            </p>
          </div>
        </div>
      </div>

      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      {!file ? (
        <MediaDropzone
          mediaKind="audio"
          accept={AUDIO_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["MP3", "WAV", "M4A"]}
          onFile={pickFile}
          onError={(message) => setPickError(message)}
          labels={{
            title: "Upload audio",
            titleBusy: "Removing vocals in worker…",
            description: "Drag and drop a stereo track or browse from your device.",
            privacyBadge: "100% Private — processed locally with ffmpeg.wasm.",
          }}
          className="rounded-none border-neutral-800 bg-[#1a1a1a]"
        />
      ) : (
        <div className="space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-neutral-200">
              {file.name} · {formatBytes(file.size)}
            </p>
            <button
              type="button"
              className={toolOutlineBtn}
              disabled={busy}
              onClick={() => {
                setFile(null);
                setPickError("");
                reset();
              }}
            >
              Choose another file
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Original
              </p>
              {previewUrl ? (
                <audio src={previewUrl} controls preload="metadata" className="w-full" />
              ) : null}
            </div>
            <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Instrumental estimate
              </p>
              {instrumentalUrl ? (
                <audio src={instrumentalUrl} controls preload="metadata" className="w-full" />
              ) : (
                <p className="py-4 text-center text-xs text-neutral-500">
                  Process the track to preview the instrumental here.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canProcess}
            onClick={() => void processAndDownload()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                Processing…
              </>
            ) : (
              <>
                <MicOff className="mr-2 inline h-4 w-4" aria-hidden />
                Process &amp; Remove Vocals
              </>
            )}
          </button>
        </div>
      )}

      {phase === "loading" || phase === "processing" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Vocal removal progress
        </p>
      ) : null}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-emerald-400">
            Instrumental ready — {formatBytes(result.blob.size)} MP3 saved locally. Compare the
            previews above to judge quality for your mix.
          </p>
          <button
            type="button"
            className={toolPrimaryBtn}
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            Download again
          </button>
          <PostSuccessUpsell operation="voice-remover" fileContext={file?.name} sourceFile={file} />
        </div>
      ) : null}
    </div>
  );
}
