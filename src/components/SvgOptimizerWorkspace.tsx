"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import {
  copyTextToClipboard,
  downloadSvgText,
  formatBytes,
  isSvgFile,
  optimizeSvgFile,
  svgPreviewObjectUrl,
  type SvgOptimizeResult,
} from "@/lib/svg-optimizer";
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

const ACCEPT = "image/svg+xml,.svg";

type SvgOptimizerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function SvgOptimizerWorkspace({ tool, slug }: SvgOptimizerWorkspaceProps) {
  const t = useTranslations("SvgOptimizer");
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<SvgOptimizeResult | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [optimizedPreviewUrl, setOptimizedPreviewUrl] = useState<string | null>(null);
  const [multipass, setMultipass] = useState(true);
  const [safeMode, setSafeMode] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const originalPreviewRef = useRef<string | null>(null);
  const optimizedPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  useEffect(() => {
    return () => {
      if (originalPreviewRef.current) URL.revokeObjectURL(originalPreviewRef.current);
      if (optimizedPreviewRef.current) URL.revokeObjectURL(optimizedPreviewRef.current);
    };
  }, []);

  const revokeOriginalPreview = () => {
    if (originalPreviewRef.current) {
      URL.revokeObjectURL(originalPreviewRef.current);
      originalPreviewRef.current = null;
    }
    setOriginalPreviewUrl(null);
  };

  const revokeOptimizedPreview = () => {
    if (optimizedPreviewRef.current) {
      URL.revokeObjectURL(optimizedPreviewRef.current);
      optimizedPreviewRef.current = null;
    }
    setOptimizedPreviewUrl(null);
  };

  const clearAll = () => {
    revokeOriginalPreview();
    revokeOptimizedPreview();
    setFile(null);
    setResult(null);
    setError(null);
    setCopied(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onFiles = async (incoming: FileList | File[]) => {
    const next = Array.from(incoming || []).find(isSvgFile);
    if (!next) {
      setError(t("invalidFile"));
      return;
    }

    revokeOriginalPreview();
    revokeOptimizedPreview();
    setResult(null);
    setCopied(false);
    setError(null);
    setFile(next);

    try {
      const text = await next.text();
      const url = svgPreviewObjectUrl(text);
      originalPreviewRef.current = url;
      setOriginalPreviewUrl(url);
    } catch {
      setError(t("readFailed"));
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

  const onOptimize = async () => {
    if (!file || busy) return;

    setBusy(true);
    setError(null);
    setCopied(false);
    revokeOptimizedPreview();
    setResult(null);

    try {
      const optimized = await optimizeSvgFile(file, { multipass, safe: safeMode });
      const url = svgPreviewObjectUrl(optimized.optimizedSvg);
      optimizedPreviewRef.current = url;
      setOptimizedPreviewUrl(url);
      setResult(optimized);
      capture(EVENTS.tool_run_success, {
        operation: tool.operation,
        slug,
        savingsPercent: optimized.savingsPercent,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("optimizeFailed");
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
    downloadSvgText(result.optimizedSvg, result.fileName);
  };

  const onCopy = async () => {
    if (!result) return;
    try {
      await copyTextToClipboard(result.optimizedSvg);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("copyFailed"));
    }
  };

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
                  SVG · {formatBytes(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={clearAll}
                disabled={busy}
                className="shrink-0 text-xs uppercase tracking-widest text-[#a3a3a3] transition-colors hover:text-white disabled:opacity-50"
              >
                {t("replaceFile")}
              </button>
            </div>

            <section
              className="grid gap-4 border border-[#262626] bg-[#0a0a0a] p-4 sm:grid-cols-2"
              aria-label={t("settingsTitle")}
            >
              <label className="flex cursor-pointer items-start gap-3 text-sm text-[#a3a3a3]">
                <input
                  type="checkbox"
                  className="mt-1 accent-white"
                  checked={multipass}
                  disabled={busy}
                  onChange={(event) => {
                    setMultipass(event.target.checked);
                    setResult(null);
                    revokeOptimizedPreview();
                  }}
                />
                <span>
                  <span className="block font-medium text-white">{t("multipassLabel")}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#737373]">
                    {t("multipassHint")}
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-[#a3a3a3]">
                <input
                  type="checkbox"
                  className="mt-1 accent-white"
                  checked={safeMode}
                  disabled={busy}
                  onChange={(event) => {
                    setSafeMode(event.target.checked);
                    setResult(null);
                    revokeOptimizedPreview();
                  }}
                />
                <span>
                  <span className="block font-medium text-white">{t("safeModeLabel")}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#737373]">
                    {t("safeModeHint")}
                  </span>
                </span>
              </label>
            </section>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onOptimize}
                disabled={busy}
                className="border border-white bg-white px-5 py-3 text-xs font-semibold uppercase tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? t("optimizing") : result ? t("optimizeAgain") : t("optimize")}
              </button>
              {result ? (
                <>
                  <button
                    type="button"
                    onClick={onDownload}
                    className="border border-[#262626] bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:border-white"
                  >
                    {t("download")}
                  </button>
                  <button
                    type="button"
                    onClick={onCopy}
                    className="border border-[#262626] bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:border-white"
                  >
                    {copied ? t("copied") : t("copyCode")}
                  </button>
                </>
              ) : null}
            </div>

            {busy ? (
              <p
                className="m-0 border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-xs uppercase tracking-widest text-[#a3a3a3]"
                role="status"
                aria-live="polite"
              >
                {t("optimizing")}
              </p>
            ) : null}

            {error ? (
              <p
                className="m-0 border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {result ? (
              <section
                className="grid gap-3 border border-[#262626] bg-[#0a0a0a] p-4 sm:grid-cols-3"
                aria-label={t("savingsTitle")}
              >
                <div>
                  <p className="m-0 text-xs uppercase tracking-widest text-[#737373]">
                    {t("originalSize")}
                  </p>
                  <p className="m-0 mt-2 text-lg font-semibold text-white">
                    {formatBytes(result.originalBytes)}
                  </p>
                </div>
                <div>
                  <p className="m-0 text-xs uppercase tracking-widest text-[#737373]">
                    {t("optimizedSize")}
                  </p>
                  <p className="m-0 mt-2 text-lg font-semibold text-white">
                    {formatBytes(result.optimizedBytes)}
                  </p>
                </div>
                <div>
                  <p className="m-0 text-xs uppercase tracking-widest text-[#737373]">
                    {t("savingsLabel")}
                  </p>
                  <p className="m-0 mt-2 text-lg font-semibold text-white">
                    {result.savingsPercent > 0
                      ? t("savingsValue", { percent: result.savingsPercent })
                      : t("noSavings")}
                  </p>
                </div>
              </section>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2" aria-label={t("previewTitle")}>
              <figure className="m-0 border border-[#262626] bg-[#0a0a0a] p-3">
                <figcaption className="mb-3 text-xs uppercase tracking-widest text-[#737373]">
                  {t("originalPreview")}
                </figcaption>
                <div className="flex min-h-40 items-center justify-center bg-[radial-gradient(circle_at_center,#171717_0,#0a0a0a_70%)] p-4">
                  {originalPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={originalPreviewUrl}
                      alt={t("originalAlt")}
                      className="max-h-48 max-w-full object-contain"
                    />
                  ) : (
                    <p className="m-0 text-xs uppercase tracking-widest text-[#525252]">
                      {t("previewUnavailable")}
                    </p>
                  )}
                </div>
              </figure>
              <figure className="m-0 border border-[#262626] bg-[#0a0a0a] p-3">
                <figcaption className="mb-3 text-xs uppercase tracking-widest text-[#737373]">
                  {t("optimizedPreview")}
                </figcaption>
                <div className="flex min-h-40 items-center justify-center bg-[radial-gradient(circle_at_center,#171717_0,#0a0a0a_70%)] p-4">
                  {optimizedPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={optimizedPreviewUrl}
                      alt={t("optimizedAlt")}
                      className="max-h-48 max-w-full object-contain"
                    />
                  ) : (
                    <p className="m-0 text-xs uppercase tracking-widest text-[#525252]">
                      {t("optimizedPlaceholder")}
                    </p>
                  )}
                </div>
              </figure>
            </section>

            {result ? (
              <section className="border border-[#262626] bg-[#0a0a0a] p-3" aria-label={t("codeTitle")}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="m-0 text-xs font-semibold uppercase tracking-widest text-[#a3a3a3]">
                    {t("codeTitle")}
                  </h2>
                </div>
                <pre className="m-0 max-h-56 overflow-auto whitespace-pre-wrap break-all p-3 text-xs leading-relaxed text-[#a3a3a3]">
                  {result.optimizedSvg}
                </pre>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </WorkspaceUploadShell>
  );
}
