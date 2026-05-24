"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { usePendingFiles } from "@/context/PendingFilesContext";
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

function ImageFilePreview({ file, pageNumber }: { file: File; pageNumber: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <figure className="image-preview-thumb">
      {url ? (
        <img src={url} alt={`Preview of ${file.name}`} className="image-preview-thumb__img" />
      ) : (
        <div className="image-preview-thumb__placeholder">Loading…</div>
      )}
      <figcaption className="image-preview-thumb__caption">Page {pageNumber}</figcaption>
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

function buildConfig(tool: ToolDefinition): OpConfig | null {
  const map: Record<string, OpConfig> = {
    merge: {
      accept: (f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name),
      minFiles: 2,
      multiple: true,
      buttonLabel: "Merge PDFs",
      async run(files, { setStatus, downloadBlob }) {
        const bytes = await pdf.mergePdfFiles(files);
        downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), "joinmypdf-merged.pdf");
        setStatus(`Merged ${files.length} file(s).`);
      },
    },
    compress: {
      accept: (f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name),
      minFiles: 1,
      multiple: false,
      buttonLabel: "Compress PDF",
      async run(files, { setStatus, downloadBlob, quality: q }) {
        const result = await pdf.compressSimulation(files[0], q / 100);
        downloadBlob(
          new Blob([result.bytes as BlobPart], { type: "application/pdf" }),
          "joinmypdf-compressed.pdf"
        );
        setStatus(`Compressed. Estimated size ratio ~${Math.round(result.estimatedRatio * 100)}% of original.`);
      },
    },
    split: {
      accept: (f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name),
      minFiles: 1,
      multiple: false,
      buttonLabel: "Split PDF",
      async run(files, { setStatus, downloadBlob }) {
        const parts = await pdf.splitPdfFile(files[0]);
        parts.forEach((entry) => {
          downloadBlob(
            new Blob([entry.bytes as BlobPart], { type: "application/pdf" }),
            `joinmypdf-page-${entry.page}.pdf`
          );
        });
        setStatus(`Split complete: ${parts.length} file(s).`);
      },
    },
    "jpg-to-pdf": {
      accept: (f) => /^image\//i.test(f.type) || /\.(jpg|jpeg|png)$/i.test(f.name),
      minFiles: 1,
      multiple: true,
      buttonLabel: "Create PDF",
      async run(files, { setStatus, downloadBlob }) {
        const bytes = await pdf.jpgToPdf(files);
        downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), "joinmypdf-images.pdf");
        setStatus(`Created PDF from ${files.length} image(s).`);
      },
    },
    "png-to-pdf": {
      accept: (f) => /png$/i.test(f.type) || /\.png$/i.test(f.name),
      minFiles: 1,
      multiple: true,
      buttonLabel: "Convert to PDF",
      async run(files, { setStatus, downloadBlob }) {
        const bytes = await pdf.pngToPdf(files);
        downloadBlob(
          new Blob([bytes as BlobPart], { type: "application/pdf" }),
          pdf.pngToPdfOutputName(files),
        );
        setStatus(`Created PDF from ${files.length} PNG image(s).`);
      },
    },
    "pdf-to-jpg": {
      accept: (f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name),
      minFiles: 1,
      multiple: false,
      buttonLabel: "Export JPG pages",
      async run(files, { setStatus, downloadBlob }) {
        const pages = await pdf.pdfToJpgPages(files[0], 1.3);
        pages.forEach((entry) => {
          downloadBlob(entry.blob, `joinmypdf-page-${entry.page}.jpg`);
        });
        setStatus(`Exported ${pages.length} JPG file(s).`);
      },
    },
  };
  return map[tool.operation] || null;
}

export function ToolWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const { consumePendingFiles } = usePendingFiles();
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [quality, setQuality] = useState(75);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const baseId = useId();

  const config = buildConfig(tool);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  useEffect(() => {
    const pending = consumePendingFiles();
    if (!pending?.length || tool.operation !== "merge") return;
    const accepted = pending.filter((f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
    if (accepted.length) {
      setFiles(accepted);
      capture(EVENTS.file_selected, { source: "home_pending", count: accepted.length });
    }
  }, [consumePendingFiles, tool.operation]);

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
        setStatus("No supported files detected.");
        return;
      }
      setFiles((prev) => {
        if (!config.multiple) return [accepted[0]];
        return [...prev, ...accepted];
      });
      setDone(false);
      setRunError(null);
      setStatus(`${accepted.length} file(s) added.`);
      capture(EVENTS.file_selected, { count: accepted.length, operation: tool.operation });
    },
    [config, tool.operation]
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
      setStatus(`Add at least ${config.minFiles} file(s).`);
      return;
    }
    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus("Processing…");
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
      // Let the browser start download(s) before showing subscription modal.
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
      <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-ink-muted">
        This tool is not available yet.
      </p>
    );
  }

  const disabled = busy || files.length < config.minFiles;
  const stickyLabel = config.buttonLabel;
  const stickyHref = `#tool-workspace`;

  const showImagePreview =
    (tool.operation === "png-to-pdf" || tool.operation === "jpg-to-pdf") && files.length > 0;

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      {tool.operation === "png-to-pdf" ? (
        <div className="privacy-callout" role="note">
          <strong>100% Secure:</strong> Image conversion runs entirely inside your browser. Your private
          images are never uploaded to any server.
        </div>
      ) : null}

      <FileUploadZone
        drag={drag}
        role="button"
        tabIndex={0}
        aria-controls={`${baseId}-input`}
        className="cursor-pointer"
        title="Drop files here or click to browse"
        description={
          tool.operation === "merge"
            ? "Select two or more PDFs. Reorder before merging."
            : tool.operation === "compress"
              ? "Select one PDF. Tune compression, then download."
              : tool.operation === "split"
                ? "Select one PDF. Each page exports as its own file."
                : tool.operation === "jpg-to-pdf"
                  ? "Select JPG/PNG images. Reorder before creating the PDF."
                  : tool.operation === "png-to-pdf"
                    ? "Select PNG images. Reorder before converting to PDF."
                    : "Select one PDF. Each page becomes a JPG."
        }
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
                  : tool.operation === "merge" ||
                      tool.operation === "compress" ||
                      tool.operation === "split"
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

      {tool.operation === "compress" ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <label className="text-sm font-medium text-ink" htmlFor={`${baseId}-q`}>
            Compression level
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
          <p className="mt-1 text-xs text-ink-muted">Higher keeps more detail; lower targets smaller files.</p>
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-semibold text-ink">Files</p>
          <ul className="mt-3 space-y-2">
            {files.map((f, idx) => (
              <li
                key={`${f.name}-${idx}`}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-surface/40 px-3 py-2 text-sm"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", String(idx))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = Number(e.dataTransfer.getData("text/plain"));
                  move(from, idx);
                }}
              >
                <span className="cursor-grab text-ink-muted" aria-hidden>
                  ::
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{f.name}</span>
                <span className="text-ink-muted">{pdf.formatBytes(f.size)}</span>
                <span className="text-ink-muted">#{idx + 1}</span>
                <button
                  type="button"
                  className="rounded-lg border border-white/15 px-2 py-1 text-xs text-ink hover:bg-white/5"
                  onClick={() => move(idx, idx - 1)}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-white/15 px-2 py-1 text-xs text-ink hover:bg-white/5"
                  onClick={() => move(idx, idx + 1)}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-400/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                  onClick={() => removeAt(idx)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showImagePreview ? (
        <div className="image-preview-grid" aria-label="Image previews">
          {files.map((f, idx) => (
            <ImageFilePreview key={`${f.name}-${f.size}-${idx}`} file={f} pageNumber={idx + 1} />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onRun}
          className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          {config.buttonLabel}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink hover:bg-white/5"
        >
          Clear
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
            setStatus("Choose another file or clear the list to try again.");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta
        href={stickyHref}
        label={stickyLabel}
        secondaryHref="/"
        secondaryLabel="Home"
      />
    </div>
  );
}
