"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { MapDiagramCrossLink } from "@/components/partner/MapDiagramCrossLink";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import type { ToolDefinition } from "@/lib/types";
import * as pdf from "@/lib/pdf-engine";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function ImageFilePreview({
  file,
  pageNumber,
  pageLabel,
  previewLabel,
  loadingLabel,
}: {
  file: File;
  pageNumber: number;
  pageLabel: string;
  previewLabel: string;
  loadingLabel: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <figure className="image-preview-thumb">
      {url ? (
        <img src={url} alt={`${previewLabel} ${file.name}`} className="image-preview-thumb__img" />
      ) : (
        <div className="image-preview-thumb__placeholder">{loadingLabel}</div>
      )}
      <figcaption className="image-preview-thumb__caption">
        {pageLabel} {pageNumber}
      </figcaption>
    </figure>
  );
}

type RunHelpers = {
  setStatus: (s: string) => void;
  downloadBlob: (blob: Blob, name: string) => void;
  reset: () => void;
  quality: number;
};

type OpConfig = {
  accept: (f: File) => boolean;
  minFiles: number;
  multiple: boolean;
  buttonLabel: string;
  run: (files: File[], h: RunHelpers) => Promise<void>;
};

function buildConfig(tool: ToolDefinition, ws: ReturnType<typeof useWorkspaceI18n>): OpConfig | null {
  const map: Record<string, OpConfig> = {
    compress: {
      accept: (f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name),
      minFiles: 1,
      multiple: false,
      buttonLabel: ws.buttonLabel(),
      async run(files, { setStatus, downloadBlob, quality: q }) {
        const result = await pdf.compressSimulation(files[0], q / 100);
        downloadBlob(
          new Blob([result.bytes as BlobPart], { type: "application/pdf" }),
          "joinmypdf-compressed.pdf",
        );
        setStatus(ws.status("complete", { percent: Math.round(result.estimatedRatio * 100) }));
      },
    },
    split: {
      accept: (f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name),
      minFiles: 1,
      multiple: false,
      buttonLabel: ws.buttonLabel(),
      async run(files, { setStatus, downloadBlob }) {
        const parts = await pdf.splitPdfFile(files[0]);
        parts.forEach((entry) => {
          downloadBlob(
            new Blob([entry.bytes as BlobPart], { type: "application/pdf" }),
            `joinmypdf-page-${entry.page}.pdf`,
          );
        });
        setStatus(ws.status("complete", { count: parts.length }));
      },
    },
    "jpg-to-pdf": {
      accept: (f) => /^image\//i.test(f.type) || /\.(jpg|jpeg|png)$/i.test(f.name),
      minFiles: 1,
      multiple: true,
      buttonLabel: ws.buttonLabel(),
      async run(files, { setStatus, downloadBlob }) {
        const bytes = await pdf.jpgToPdf(files);
        downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), "joinmypdf-images.pdf");
        setStatus(ws.status("complete", { count: files.length }));
      },
    },
    "png-to-pdf": {
      accept: (f) => /png$/i.test(f.type) || /\.png$/i.test(f.name),
      minFiles: 1,
      multiple: true,
      buttonLabel: ws.buttonLabel(),
      async run(files, { setStatus, downloadBlob }) {
        const bytes = await pdf.pngToPdf(files);
        downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), pdf.pngToPdfOutputName(files));
        setStatus(ws.status("complete", { count: files.length }));
      },
    },
    "pdf-to-jpg": {
      accept: (f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name),
      minFiles: 1,
      multiple: false,
      buttonLabel: ws.buttonLabel(),
      async run(files, { setStatus, downloadBlob }) {
        const pages = await pdf.pdfToJpgPages(files[0], 1.3);
        pages.forEach((entry) => {
          downloadBlob(entry.blob, `joinmypdf-page-${entry.page}.jpg`);
        });
        setStatus(ws.status("complete", { count: pages.length }));
      },
    },
  };
  return map[tool.operation] || null;
}

export function ToolWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const config = buildConfig(tool, ws);

  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [quality, setQuality] = useState(75);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const baseId = useId();

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFiles([]);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addRaw = useCallback(
    (incoming: FileList | File[]) => {
      if (!config) return;
      const accepted = Array.from(incoming || []).filter(config.accept);
      if (!accepted.length) {
        setStatus(ws.status("noSupportedFiles"));
        return;
      }
      setFiles((prev) => {
        if (!config.multiple) return [accepted[0]];
        return [...prev, ...accepted];
      });
      setDone(false);
      setRunError(null);
      setStatus(ws.status("filesAdded", { count: accepted.length }));
      capture(EVENTS.file_selected, { count: accepted.length, operation: tool.operation });
    },
    [config, tool.operation, ws],
  );

  const removeAt = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setFiles((prev) => {
      const next = prev.slice();
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  };

  const onRun = async () => {
    if (!config) return;
    if (files.length < config.minFiles) {
      setStatus(ws.status("addAtLeast", { count: config.minFiles }));
      return;
    }
    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.processing);
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });
    try {
      await config.run(files, {
        setStatus,
        downloadBlob,
        reset,
        quality,
      });
      setDone(true);
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      capture(EVENTS.download_click, { operation: tool.operation, slug });
      window.setTimeout(() => {
        dispatchToolComplete({ operation: tool.operation, slug });
      }, 400);
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      capture(EVENTS.tool_run_error, {
        operation: tool.operation,
        slug,
        message: parsed.message,
        kind: parsed.kind,
      });
    } finally {
      setBusy(false);
    }
  };

  if (!config) {
    return (
      <p className="rounded-none border border-neutral-300 dark:border-neutral-800/60 bg-white p-4 text-black dark:text-neutral-200 dark:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-200 dark:bg-neutral-900 dark:text-ink-muted">
        {ws.common("notAvailable")}
      </p>
    );
  }

  const disabled = busy || files.length < config.minFiles;
  const stickyLabel = config.buttonLabel;

  const showImagePreview =
    (tool.operation === "png-to-pdf" || tool.operation === "jpg-to-pdf") && files.length > 0;
  const supportedFormats =
    tool.operation === "png-to-pdf"
      ? [ws.common("formatPng")]
      : tool.operation === "jpg-to-pdf"
        ? [ws.common("formatJpg"), ws.common("formatPng")]
        : [ws.common("formatPdf")];

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell
        securePrefix={ws.securePrefix}
        privacyNote={tool.operation === "png-to-pdf" ? ws.common("pngPrivacy") : ws.common("privacyBody")}
        showBanner={tool.operation === "png-to-pdf"}
      >
      <FileUploadZone
        operation={tool.operation}
        drag={drag}
        role="button"
        tabIndex={0}
        aria-controls={`${baseId}-input`}
        className="cursor-pointer"
        supportedFormats={supportedFormats}
        onKeyDown={(e: ReactKeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addRaw(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        input={
          <input
            id={`${baseId}-input`}
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={
              tool.operation === "png-to-pdf"
                ? "image/png,.png"
                : tool.operation === "jpg-to-pdf"
                  ? "image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                  : tool.operation === "compress" || tool.operation === "split"
                    ? "application/pdf,.pdf"
                    : undefined
            }
            multiple={config.multiple}
            onChange={(e) => {
              if (e.target.files?.length) addRaw(e.target.files);
              e.target.value = "";
            }}
          />
        }
      />
      </WorkspaceUploadShell>

      <MapDiagramCrossLink className="max-w-2xl mx-auto" />

      {tool.operation === "compress" ? (
        <div className="rounded-none border border-neutral-300 dark:border-neutral-800/60 bg-white p-4 dark:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-200 dark:bg-neutral-900">
          <label className="text-sm font-medium text-black dark:text-neutral-200 dark:text-ink" htmlFor={`${baseId}-q`}>
            {ws.common("compressionLevel")}
          </label>
          <input
            id={`${baseId}-q`}
            type="range"
            min={55}
            max={95}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="mt-2 w-full"
          />
          <p className="mt-1 text-xs text-black dark:text-neutral-200 dark:text-ink-muted">{ws.common("compressionHint")}</p>
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className="rounded-none border border-neutral-300 dark:border-neutral-800/60 bg-white p-4 dark:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-200 dark:bg-neutral-900">
          <p className="text-sm font-semibold text-black dark:text-neutral-200 dark:text-ink">{ws.common("files")}</p>
          <ul className="mt-3 space-y-2">
            {files.map((f, idx) => (
              <li
                key={`${f.name}-${idx}`}
                className="flex flex-wrap items-center gap-2 rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 px-3 py-2 text-sm dark:border-neutral-300 dark:border-neutral-800 dark:bg-surface/40"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", String(idx))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = Number(e.dataTransfer.getData("text/plain"));
                  move(from, idx);
                }}
              >
                <span className="cursor-grab text-black dark:text-neutral-200 dark:text-ink-muted" aria-hidden>
                  ::
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-black dark:text-neutral-200 dark:text-ink">{f.name}</span>
                <span className="text-black dark:text-neutral-200 dark:text-ink-muted">{pdf.formatBytes(f.size)}</span>
                <span className="text-black dark:text-neutral-200 dark:text-ink-muted">#{idx + 1}</span>
                <button
                  type="button"
                  className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-white px-2 py-1 text-xs text-black dark:text-neutral-200 hover:bg-neutral-100 dark:bg-neutral-900 dark:border-white/15 dark:bg-transparent dark:text-ink dark:hover:bg-white/5"
                  onClick={() => move(idx, idx - 1)}
                >
                  {ws.common("up")}
                </button>
                <button
                  type="button"
                  className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-white px-2 py-1 text-xs text-black dark:text-neutral-200 hover:bg-neutral-100 dark:bg-neutral-900 dark:border-white/15 dark:bg-transparent dark:text-ink dark:hover:bg-white/5"
                  onClick={() => move(idx, idx + 1)}
                >
                  {ws.common("down")}
                </button>
                <button
                  type="button"
                  className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-2 py-1 text-xs text-black dark:text-neutral-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:border-neutral-300 dark:border-neutral-800 dark:bg-transparent dark:text-black dark:text-neutral-200 dark:hover:bg-neutral-200 dark:bg-neutral-800"
                  onClick={() => removeAt(idx)}
                >
                  {ws.common("remove")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showImagePreview ? (
        <div className="image-preview-grid" aria-label={ws.common("imagePreviews")}>
          {files.map((f, idx) => (
            <ImageFilePreview
              key={`${f.name}-${f.size}-${idx}`}
              file={f}
              pageNumber={idx + 1}
              pageLabel={ws.common("page")}
              previewLabel={ws.common("previewOf")}
              loadingLabel={ws.common("loading")}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onRun}
          className="rounded-none bg-neutral-200 dark:bg-neutral-800 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-neutral-200 dark:bg-neutral-700 hover: disabled:cursor-not-allowed disabled:opacity-50 dark:text-surface"
        >
          {busy ? ws.processing : config.buttonLabel}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-5 py-3 text-sm font-semibold text-black dark:text-neutral-200 transition hover:bg-neutral-200 dark:bg-neutral-900 dark:border-white/15 dark:bg-transparent dark:text-ink dark:hover:bg-white/5"
        >
          {ws.clear}
        </button>
      </div>

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(ws.status("chooseAnotherOrClear"));
          }}
        />
      ) : (
        <p className="text-sm text-black dark:text-neutral-200 dark:text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta href="#tool-workspace" label={stickyLabel} secondaryHref="/" secondaryLabel={ws.home} />
    </div>
  );
}
