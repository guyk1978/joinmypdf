"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";;
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  extractImagesFromPdf,
  extractImagesZipName,
  type ExtractedPdfImage,
} from "@/lib/pdf-extract-images";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
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

type PreviewImage = ExtractedPdfImage & { previewUrl: string };

function ImageThumb({
  entry,
  onDownload,
}: {
  entry: PreviewImage;
  onDownload: (entry: PreviewImage) => void;
}) {
  return (
    <div className="pdf-export-thumb">
      <div className="pdf-export-thumb__canvas-wrap">
        <img src={entry.previewUrl} alt={`Extracted image ${entry.index} on page ${entry.page}`} className="pdf-export-thumb__img" />
      </div>
      <div className="pdf-export-thumb__footer">
        <span className="pdf-export-thumb__label">
          Page {entry.page} · Image {entry.index}
        </span>
        <button
          type="button"
          className="pdf-export-thumb__download"
          onClick={() => onDownload(entry)}
        >
          Download image
        </button>
      </div>
    </div>
  );
}

export function ExtractImagesWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [images, setImages] = useState<PreviewImage[] | null>(null);
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
    setImages(null);
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
      setStatus("Please choose a PDF file.");
      return;
    }
    if (next.size === 0) {
      setStatus("That file is empty. Choose another PDF.");
      return;
    }
    revokePreviews();
    setFile(next);
    setImages(null);
    setDone(false);
    setRunError(null);
    setStatus("Loading PDF...");
    try {
      await loadPdfMeta(next);
      setStatus(`${next.name} ready — extract embedded images.`);
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setPageCount(0);
    }
  };

  const onExtract = async () => {
    if (!file) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus("Scanning PDF for image objects...");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });
    revokePreviews();
    try {
      const extracted = await extractImagesFromPdf(file, (page, total) => {
        setStatus(`Scanning page ${page} of ${total}...`);
      });
      const withPreview = extracted.map((entry) => {
        const previewUrl = URL.createObjectURL(entry.blob);
        previewUrlsRef.current.push(previewUrl);
        return { ...entry, previewUrl };
      });
      setImages(withPreview);
      setDone(true);
      setStatus(
        withPreview.length
          ? `Found ${withPreview.length} image object(s). Download individually or as ZIP.`
          : "No embedded image objects were found in this PDF.",
      );
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug, count: withPreview.length });
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

  const onDownloadSingle = (entry: PreviewImage) => {
    downloadBlob(entry.blob, entry.name);
    capture(EVENTS.download_click, {
      operation: tool.operation,
      slug,
      page: entry.page,
      format: "png",
    });
  };

  const onDownloadZip = async () => {
    if (!file || !images?.length) return;
    setBusy(true);
    setStatus("Building ZIP...");
    try {
      const zip = await zipBlobs(images.map((entry) => ({ name: entry.name, blob: entry.blob })));
      downloadBlob(zip, extractImagesZipName(file));
      setStatus(`Downloaded ZIP with ${images.length} image file(s).`);
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
  const canExtract = Boolean(file) && !busy;
  const hasImages = Boolean(images?.length);

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Secure:</strong> Image extraction runs entirely in your browser. Your PDF never
        leaves your device.
      </div>

      {!showWorkspace ? (
        <FileUploadZone
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title="Drop a PDF here or click to browse"
          description="Detect and extract embedded image objects from your PDF."
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
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-slate-100">{file?.name}</strong>
            {pageCount ? ` · ${pageCount} page${pageCount === 1 ? "" : "s"}` : null}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canExtract}
              onClick={() => void onExtract()}
              className={toolPrimaryBtn}
            >
              {hasImages ? "Extract again" : "Extract images"}
            </button>
            {hasImages ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDownloadZip()}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                Download all as ZIP
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className={toolSecondaryBtn}
            >
              Choose another file
            </button>
          </div>

          {hasImages ? (
            <div className="pdf-export-grid" aria-label="Extracted images">
              {images!.map((entry) => (
                <ImageThumb key={entry.name} entry={entry} onDownload={onDownloadSingle} />
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
            setStatus(file ? "Try again or choose another file." : "");
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
        label={hasImages ? "Download ZIP" : "Extract images"}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
