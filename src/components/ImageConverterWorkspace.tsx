"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { loadImageFileForCrop } from "@/lib/crop-image";
import {
  convertImageFile,
  detectImageFormatLabel,
  downloadBlob,
  imageConverterFormats,
  isAcceptedImageFile,
  type ImageConverterFormat,
  type ImageConverterResult,
} from "@/lib/image-converter";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif";

type ImageConverterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function ImageConverterWorkspace({ tool, slug }: ImageConverterWorkspaceProps) {
  const t = useTranslations("ImageConverter");
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formatLabel, setFormatLabel] = useState("");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ImageConverterResult | null>(null);
  const [outputFormat, setOutputFormat] = useState<ImageConverterFormat>("webp");
  const [quality, setQuality] = useState(92);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const originalUrlRef = useRef<string | null>(null);
  const convertedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  useEffect(() => {
    return () => {
      if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
      if (convertedUrlRef.current) URL.revokeObjectURL(convertedUrlRef.current);
    };
  }, []);

  const revokeOriginal = () => {
    if (originalUrlRef.current) {
      URL.revokeObjectURL(originalUrlRef.current);
      originalUrlRef.current = null;
    }
    setOriginalUrl(null);
  };

  const revokeConverted = () => {
    if (convertedUrlRef.current) {
      URL.revokeObjectURL(convertedUrlRef.current);
      convertedUrlRef.current = null;
    }
    setConvertedUrl(null);
  };

  const resetResult = () => {
    revokeConverted();
    setResult(null);
    setProgress(0);
    setError(null);
  };

  const clearAll = () => {
    revokeOriginal();
    resetResult();
    setFile(null);
    setFormatLabel("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onFiles = async (incoming: FileList | File[]) => {
    const next = Array.from(incoming || []).find(isAcceptedImageFile);
    if (!next) {
      setError(t("invalidFile"));
      return;
    }

    revokeOriginal();
    resetResult();
    setFile(next);
    setFormatLabel(detectImageFormatLabel(next));
    setError(null);

    try {
      const url = await loadImageFileForCrop(next);
      originalUrlRef.current = url;
      setOriginalUrl(url);
    } catch {
      const url = URL.createObjectURL(next);
      originalUrlRef.current = url;
      setOriginalUrl(url);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (!busy) void onFiles(event.dataTransfer.files);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) void onFiles(event.target.files);
    event.target.value = "";
  };

  const onConvert = async () => {
    if (!file || busy) return;

    setBusy(true);
    setError(null);
    revokeConverted();
    setResult(null);
    setProgress(0);

    try {
      const converted = await convertImageFile(file, {
        format: outputFormat,
        quality: quality / 100,
        onProgress: setProgress,
      });

      const url = URL.createObjectURL(converted.blob);
      convertedUrlRef.current = url;
      setConvertedUrl(url);
      setResult(converted);
      capture(EVENTS.tool_run_success, {
        operation: tool.operation,
        slug,
        format: outputFormat,
        usedWorker: converted.usedWorker,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("convertFailed");
      setError(message);
      capture(EVENTS.tool_run_error, {
        operation: tool.operation,
        slug,
        message,
      });
    } finally {
      setBusy(false);
    }
  };

  const onDownload = () => {
    if (!result) return;
    capture(EVENTS.download_click, { operation: tool.operation, slug });
    downloadBlob(result.blob, result.fileName);
  };

  const formats = imageConverterFormats();
  const showQuality = outputFormat === "webp" || outputFormat === "jpg" || outputFormat === "heic";

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="space-y-6">
        <p className="m-0 rounded-sm border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-xs uppercase tracking-widest text-[#a3a3a3]">
          {t("privacyBadge")}
        </p>

        {!file ? (
          <div className="space-y-3">
            <div
              role="button"
              tabIndex={busy ? -1 : 0}
              aria-label={t("selectFileAria")}
              aria-disabled={busy || undefined}
              className={clsx(
                "flex w-full cursor-pointer flex-col items-center justify-center gap-3 bg-[#0a0a0a] px-6 py-14 text-center",
                "border-2 border-dashed border-[#262626] transition-colors",
                dragActive && "border-[#525252] bg-[#111111]",
                busy && "pointer-events-none opacity-55",
              )}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onClick={() => inputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragActive(false);
              }}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                id={`${baseId}-input`}
                type="file"
                className="sr-only"
                accept={ACCEPT}
                disabled={busy}
                onChange={onInputChange}
              />
              <p className="m-0 text-lg text-[#737373]">{t("dropTitle")}</p>
              <span className="text-base font-medium text-white">{t("selectFile")}</span>
              <p className="m-0 text-xs uppercase tracking-widest text-[#525252]">{t("dropHint")}</p>
            </div>
            <p className="m-0 text-center text-sm text-[#737373]" role="note">
              <span
                className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"
                aria-hidden
              />
              {t("privacyBadge")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border border-[#262626] bg-[#0a0a0a] px-4 py-3">
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-medium text-white">{file.name}</p>
                <p className="m-0 mt-1 text-xs uppercase tracking-widest text-[#737373]">
                  {formatLabel} · {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={clearAll}
                disabled={busy}
                className="shrink-0 text-xs uppercase tracking-widest text-[#a3a3a3] transition-colors hover:text-white disabled:opacity-50"
              >
                {t("replaceImage")}
              </button>
            </div>

            <section
              className="grid gap-4 border border-[#262626] bg-[#0a0a0a] p-4 md:grid-cols-2"
              aria-label={t("settingsTitle")}
            >
              <div className="md:col-span-2">
                <h2 className="m-0 mb-3 text-xs font-semibold uppercase tracking-widest text-[#a3a3a3]">
                  {t("outputFormat")}
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {formats.map((format) => (
                    <button
                      key={format}
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setOutputFormat(format);
                        resetResult();
                      }}
                      className={clsx(
                        "border px-3 py-3 text-sm font-medium uppercase tracking-wider transition-colors disabled:opacity-50",
                        outputFormat === format
                          ? "border-white bg-white text-black"
                          : "border-[#262626] bg-transparent text-[#a3a3a3] hover:border-[#404040] hover:text-white",
                      )}
                    >
                      {t(`formats.${format}`)}
                    </button>
                  ))}
                </div>
                {outputFormat === "heic" ? (
                  <p className="m-0 mt-3 text-xs leading-relaxed text-[#a3a3a3]">
                    {t("heicOutputNote")}
                  </p>
                ) : null}
              </div>

              {showQuality ? (
                <div className="md:col-span-2">
                  <label
                    htmlFor={`${baseId}-quality`}
                    className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#a3a3a3]"
                  >
                    {t("qualityLabel", { percent: quality })}
                  </label>
                  <input
                    id={`${baseId}-quality`}
                    type="range"
                    min={50}
                    max={100}
                    step={1}
                    value={quality}
                    disabled={busy}
                    onChange={(event) => {
                      setQuality(Number(event.target.value));
                      resetResult();
                    }}
                    className="w-full accent-white"
                  />
                </div>
              ) : (
                <p className="m-0 text-xs leading-relaxed text-[#737373] md:col-span-2">
                  {t("pngQualityHint")}
                </p>
              )}
            </section>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onConvert}
                disabled={busy}
                className="border border-white bg-white px-5 py-3 text-xs font-semibold uppercase tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? t("converting") : result ? t("convertAgain") : t("convert")}
              </button>
              {result ? (
                <button
                  type="button"
                  onClick={onDownload}
                  className="border border-[#262626] bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:border-white"
                >
                  {t("download")}
                </button>
              ) : null}
            </div>

            {busy ? (
              <div
                className="border border-[#262626] bg-[#0a0a0a] p-4"
                role="status"
                aria-live="polite"
              >
                <p className="m-0 mb-2 text-xs uppercase tracking-widest text-[#a3a3a3]">
                  {t("convertingProgress", { percent: progress })}
                </p>
                <div className="h-1 w-full overflow-hidden bg-[#171717]">
                  <div
                    className="h-full bg-white transition-[width] duration-200"
                    style={{ width: `${Math.max(4, progress)}%` }}
                  />
                </div>
              </div>
            ) : null}

            {error ? (
              <p
                className="m-0 border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {(originalUrl || convertedUrl) && (
              <section className="grid gap-4 md:grid-cols-2" aria-label={t("previewTitle")}>
                <figure className="m-0 border border-[#262626] bg-[#0a0a0a] p-3">
                  <figcaption className="mb-3 text-xs uppercase tracking-widest text-[#737373]">
                    {t("originalPreview")}
                  </figcaption>
                  {originalUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={originalUrl}
                      alt={t("originalAlt")}
                      className="mx-auto max-h-64 w-auto max-w-full object-contain"
                    />
                  ) : null}
                </figure>
                <figure className="m-0 border border-[#262626] bg-[#0a0a0a] p-3">
                  <figcaption className="mb-3 text-xs uppercase tracking-widest text-[#737373]">
                    {t("convertedPreview")}
                    {result ? ` · ${result.width}×${result.height}` : ""}
                  </figcaption>
                  {convertedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={convertedUrl}
                      alt={t("convertedAlt")}
                      className="mx-auto max-h-64 w-auto max-w-full object-contain"
                    />
                  ) : (
                    <p className="m-0 py-16 text-center text-xs uppercase tracking-widest text-[#525252]">
                      {t("convertedPlaceholder")}
                    </p>
                  )}
                </figure>
              </section>
            )}

            {result?.heicEncodeFallback ? (
              <p className="m-0 text-xs leading-relaxed text-[#a3a3a3]">{t("heicFallbackNotice")}</p>
            ) : null}
          </div>
        )}
      </div>
    </WorkspaceUploadShell>
  );
}
