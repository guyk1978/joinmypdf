"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
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
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

const ACCEPT = "image/svg+xml,.svg";

type SvgOptimizerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function SvgOptimizerWorkspace({ tool, slug }: SvgOptimizerWorkspaceProps) {
  const t = useTranslations("SvgOptimizer");
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
    <WorkspaceUploadShell showPrivacyBadge={false} active={Boolean(file)}>
      <div id={WORKSPACE_OPERATIONS_ID} className="svg-optimizer-tool-page">
        {!file ? (
          <ImageToolDropzone
            dropTitle={t("dropTitle")}
            selectLabel={t("selectFile")}
            selectAria={t("selectFileAria")}
            dropHint={t("dropHint")}
            privacyLabel={t("privacyBadge")}
            accept={ACCEPT}
            disabled={busy}
            onFiles={(files) => {
              void onFiles(files);
            }}
          />
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
