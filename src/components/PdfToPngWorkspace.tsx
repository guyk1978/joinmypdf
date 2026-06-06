"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";

const PNG_DOWNLOAD_BTN =
  "block w-full rounded-none border border-neutral-300 dark:border-neutral-800 bg-white px-3 py-1.5 text-center text-xs font-bold text-black dark:text-neutral-200 transition-colors hover:bg-neutral-900 hover:text-white dark:border-neutral-300 dark:border-neutral-800 dark:bg-slate-800 dark:text-black dark:text-neutral-200 dark:hover:border-neutral-300 dark:border-neutral-800 dark:hover:bg-neutral-900 dark:hover:text-white";
import * as pdf from "@/lib/pdf-engine";
import { PDF_TO_PNG_SCALE } from "@/lib/pdf-to-png";
import { formatPageCount } from "@/lib/workspace-meta-i18n";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import { zipBlobs } from "@/lib/zip-blobs";
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

type ExportedPage = { page: number; blob: Blob; previewUrl: string };

function ExportThumb({
  entry,
  onDownload,
  pageLabel,
  downloadLabel,
}: {
  entry: ExportedPage;
  onDownload: (entry: ExportedPage) => void;
  pageLabel: string;
  downloadLabel: string;
}) {
  return (
    <div className="pdf-export-thumb">
      <div className="pdf-export-thumb__canvas-wrap">
        <img src={entry.previewUrl} alt={pageLabel} className="pdf-export-thumb__img" />
      </div>
      <div className="pdf-export-thumb__footer">
        <span className="pdf-export-thumb__label">{pageLabel}</span>
        <button
          type="button"
          className={`pdf-export-thumb__download ${PNG_DOWNLOAD_BTN}`}
          onClick={() => onDownload(entry)}
        >
          {downloadLabel}
        </button>
      </div>
    </div>
  );
}

export function PdfToPngWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pages, setPages] = useState<ExportedPage[] | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const baseId = useId();

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const revokePreviews = useCallback(() => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
  }, []);

  const reset = useCallback(() => {
    revokePreviews();
    setFile(null);
    setPageCount(0);
    setPages(null);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [revokePreviews]);

  useEffect(() => () => revokePreviews(), [revokePreviews]);

  const loadPdfMeta = async (next: File) => {
    const pdfjs = await import("pdfjs-dist");
    const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    const url = URL.createObjectURL(next);
    try {
      const doc = await pdfjs.getDocument({ url }).promise;
      setPageCount(doc.numPages);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const pickFile = async (next: File) => {
    if (!acceptPdf(next)) {
      setStatus(ws.wsCommon("choosePdf"));
      return;
    }
    revokePreviews();
    setFile(next);
    setPages(null);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsCommon("loadingPdf"));
    try {
      await loadPdfMeta(next);
      setStatus(ws.wsStatus("fileReady", { name: next.name }));
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setPageCount(0);
    }
  };

  const onExport = async () => {
    if (!file) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("rendering", { count: pageCount, scale: PDF_TO_PNG_SCALE }));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });
    revokePreviews();
    try {
      const rendered = await pdf.pdfToPngPages(file, PDF_TO_PNG_SCALE);
      const exported: ExportedPage[] = rendered.map((entry) => {
        const previewUrl = URL.createObjectURL(entry.blob);
        previewUrlsRef.current.push(previewUrl);
        return { page: entry.page, blob: entry.blob, previewUrl };
      });
      setPages(exported);
      setDone(true);
      setStatus(ws.wsStatus("exported", { count: exported.length }));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
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

  const onDownloadPage = (entry: ExportedPage) => {
    if (!file) return;
    downloadBlob(entry.blob, pdf.pdfToPngFileName(file, entry.page));
    capture(EVENTS.download_click, { operation: tool.operation, slug, page: entry.page });
  };

  const onDownloadZip = async () => {
    if (!file || !pages?.length) return;
    setBusy(true);
    setStatus(ws.wsCommon("processing"));
    try {
      const zip = await zipBlobs(
        pages.map((entry) => ({
          name: pdf.pdfToPngFileName(file, entry.page),
          blob: entry.blob,
        })),
      );
      downloadBlob(zip, pdf.pdfToPngZipName(file));
      setStatus(ws.wsStatus("zipDownloaded", { count: pages.length }));
      capture(EVENTS.download_click, { operation: tool.operation, slug, format: "zip" });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
    } finally {
      setBusy(false);
    }
  };

  const showWorkspace = Boolean(file);
  const canExport = Boolean(file) && !busy;
  const hasPages = Boolean(pages?.length);

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>{ws.securePrefix}</strong> {ws.wsText("privacyNote")}
      </div>

      {!showWorkspace ? (
        <FileUploadZone
          operation={tool.operation}
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title={ws.uploadTitle()}
          description={ws.uploadDescription()}
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
            const picked = e.dataTransfer.files?.[0];
            if (picked) void pickFile(picked);
          }}
          onClick={() => inputRef.current?.click()}
          input={
            <input
              id={`${baseId}-input`}
              ref={inputRef}
              type="file"
              className="sr-only"
              accept="application/pdf,.pdf"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) void pickFile(picked);
                e.target.value = "";
              }}
            />
          }
        />
      ) : null}

      {showWorkspace ? (
        <div className="pdf-export-workspace space-y-4">
          <p className="text-sm text-neutral-800 dark:text-neutral-400 dark:text-slate-400">
            <strong className="text-black dark:text-neutral-200 dark:text-slate-100">{file?.name}</strong>
            {pageCount ? ` · ${formatPageCount(ws, pageCount)}` : null}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canExport || busy}
              onClick={() => void onExport()}
              className={toolPrimaryBtn}
            >
              {hasPages ? ws.wsText("reexportLabel") : ws.wsText("exportLabel")}
            </button>
            {hasPages ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDownloadZip()}
                className="rounded-none bg-neutral-900 dark:bg-neutral-200 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-neutral-900 dark:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {ws.wsText("downloadZipLabel")}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className={toolSecondaryBtn}
            >
              {ws.chooseAnotherFile}
            </button>
          </div>

          {hasPages ? (
            <div className="pdf-export-grid" aria-label={ws.wsUi("gridLabel")}>
              {pages!.map((entry) => (
                <ExportThumb
                  key={entry.page}
                  entry={entry}
                  onDownload={onDownloadPage}
                  pageLabel={ws.wsCommon("pageNumber", { page: entry.page })}
                  downloadLabel={ws.wsUi("downloadPng")}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(file ? ws.wsStatus("tryAgain") : "");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={hasPages ? ws.wsText("stickyDownloadLabel") : ws.wsText("stickyExportLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
