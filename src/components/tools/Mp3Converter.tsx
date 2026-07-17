"use client";

import { clsx } from "clsx";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useId, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { isSupportedMp3Source } from "@/components/tools/ffmpeg/convert-to-mp3";
import { useFfmpegAudioConvert, type FfmpegAudioConvertResult } from "@/components/tools/hooks/useFfmpegAudioConvert";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const AUDIO_ACCEPT = "audio/wav,audio/x-wav,audio/ogg,audio/aac,audio/mp4,audio/m4a,audio/mpeg,.wav,.ogg,.aac,.m4a,.mp3";
const BITRATE_OPTIONS = [128, 192, 256, 320] as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export type Mp3ConverterProps = ToolModuleProps & {
  onComplete?: (result: FfmpegAudioConvertResult) => void;
};

export function Mp3Converter({ name, title: _title, onComplete }: Mp3ConverterProps) {
  const t = useTranslations("Mp3Converter");
  const bitrateId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [bitrateKbps, setBitrateKbps] = useState<(typeof BITRATE_OPTIONS)[number]>(192);
  const [pickError, setPickError] = useState("");

  const {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    result,
    convert,
    reset,
  } = useFfmpegAudioConvert({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || error;

  const pickFile = useCallback(
    (next: File) => {
      if (!isSupportedMp3Source(next)) {
        setPickError(t("invalidFile"));
        return;
      }
      setFile(next);
      setPickError("");
      reset();
    },
    [reset, t],
  );

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const canConvert = Boolean(file) && !busy && environment?.canRun !== false;

  return (
    <div className="mp3-converter-tool space-y-4">
      <p className="text-sm leading-relaxed text-neutral-400">{t("intro")}</p>

      <FfmpegEnvironmentNotice
        environment={environment}
        error={displayError && phase === "error" ? displayError : pickError || blockingError}
      />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      {!file ? (
        <MediaDropzone
          mediaKind="audio"
          accept={AUDIO_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["WAV", "OGG", "AAC", "M4A"]}
          onFile={pickFile}
          onError={(message) => setPickError(message)}
          labels={{
            title: t("uploadTitle", { name }),
            titleBusy: t("uploadTitleBusy"),
            description: t("uploadDescription"),
            privacyBadge: t("privacyBadge"),
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
              {t("chooseAnother")}
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300" htmlFor={bitrateId}>
              {t("bitrateLabel")}
            </label>
            <select
              id={bitrateId}
              value={bitrateKbps}
              disabled={busy}
              onChange={(event) =>
                setBitrateKbps(Number(event.target.value) as (typeof BITRATE_OPTIONS)[number])
              }
              className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            >
              {BITRATE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value} kbps
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canConvert}
            onClick={() => void convert(file, bitrateKbps)}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                {t("converting")}
              </>
            ) : (
              t("convertToMp3")
            )}
          </button>
        </div>
      )}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-emerald-400">
            {t("success", { size: formatBytes(result.blob.size) })}
          </p>
          <button type="button" className={toolPrimaryBtn} onClick={download}>
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            {t("download", { fileName: result.fileName })}
          </button>
          <PostSuccessUpsell operation="mp3-converter" fileContext={file?.name} sourceFile={file} />
        </div>
      ) : null}
    </div>
  );
}
