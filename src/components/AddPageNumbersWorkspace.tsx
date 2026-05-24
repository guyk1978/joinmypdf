"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import type { AddPageNumbersOptions, PageNumberFormat, PageNumberPosition } from "@/lib/add-page-numbers";
import * as pdf from "@/lib/pdf-engine";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

const POSITIONS: { value: PageNumberPosition; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
];

export function AddPageNumbersWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
  const [startPage, setStartPage] = useState(1);
  const [format, setFormat] = useState<PageNumberFormat>("number");
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setPosition("bottom-center");
    setStartPage(1);
    setFormat("number");
    setFormError("");
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const loadPageCount = async (next: File) => {
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

  const addFile = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming || []).filter(acceptPdf);
      if (!list.length) {
        setStatus("Choose a valid PDF file.");
        return;
      }
      const next = list[0];
      setFile(next);
      setDone(false);
      setRunError(null);
      setFormError("");
      setStartPage(1);
      setStatus("Loading PDF…");
      try {
        await loadPageCount(next);
        setStatus("PDF ready — choose numbering options below.");
        capture(EVENTS.file_selected, { count: 1, operation: tool.operation });
      } catch (e) {
        const parsed = classifyPdfError(e);
        setRunError(parsed);
        setStatus("");
        setFile(null);
        setPageCount(0);
      }
    },
    [acceptPdf, tool.operation],
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || busy) return;

    setFormError("");
    setRunError(null);

    const start = Math.floor(startPage);
    if (!Number.isFinite(start) || start < 1) {
      setFormError("Start page must be at least 1.");
      return;
    }
    if (pageCount && start > pageCount) {
      setFormError(`Start page cannot exceed ${pageCount}.`);
      return;
    }

    const options: AddPageNumbersOptions = {
      position,
      startPage: start,
      format,
    };

    setBusy(true);
    setDone(false);
    setStatus("Adding page numbers…");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await pdf.addPageNumbersFile(file, options);
      const outName = pdf.addPageNumbersOutputName(file);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(`Numbered PDF downloaded as ${outName}.`);
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

  const showOptions = Boolean(file);

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Private:</strong> Page numbering is processed entirely in your browser. Your documents
        never leave your computer.
      </div>

      {!showOptions ? (
        <FileUploadZone
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title="Drop a PDF here or click to browse"
          description="Add page numbers with your preferred position and format."
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
            void addFile(e.dataTransfer.files);
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
                if (e.target.files?.length) void addFile(e.target.files);
                e.target.value = "";
              }}
            />
          }
        />
      ) : null}

      {showOptions ? (
        <form className="space-y-4" onSubmit={onSubmit}>
          <p className="text-sm text-ink-muted">
            <strong className="text-ink">{file?.name}</strong>
            {pageCount ? ` · ${pageCount} page${pageCount === 1 ? "" : "s"}` : null}
          </p>

          <div className="page-numbers-form rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
            <div className="page-numbers-form__row">
              <label className="page-numbers-form__label" htmlFor={`${baseId}-position`}>
                Position
              </label>
              <select
                id={`${baseId}-position`}
                className="page-numbers-form__select"
                value={position}
                onChange={(e) => setPosition(e.target.value as PageNumberPosition)}
                disabled={busy}
              >
                {POSITIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="page-numbers-form__row">
              <label className="page-numbers-form__label" htmlFor={`${baseId}-start`}>
                Start from page
              </label>
              <input
                id={`${baseId}-start`}
                className="page-numbers-form__input"
                type="number"
                min={1}
                max={pageCount || undefined}
                value={startPage}
                onChange={(e) => setStartPage(Number(e.target.value))}
                disabled={busy}
              />
            </div>

            <fieldset className="page-numbers-form__fieldset">
              <legend className="page-numbers-form__label">Format</legend>
              <label className="page-numbers-form__radio">
                <input
                  type="radio"
                  name={`${baseId}-format`}
                  value="number"
                  checked={format === "number"}
                  onChange={() => setFormat("number")}
                  disabled={busy}
                />
                <span>Number only (e.g. 1)</span>
              </label>
              <label className="page-numbers-form__radio">
                <input
                  type="radio"
                  name={`${baseId}-format`}
                  value="page-of"
                  checked={format === "page-of"}
                  onChange={() => setFormat("page-of")}
                  disabled={busy}
                />
                <span>Page X of Y (e.g. Page 1 of 10)</span>
              </label>
            </fieldset>

            {formError ? (
              <p className="page-numbers-form__error" role="alert">
                {formError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add Page Numbers
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink hover:bg-white/5"
            >
              Choose another file
            </button>
          </div>
        </form>
      ) : null}

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(file ? "Adjust options and try again." : "");
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
        label="Add Page Numbers"
        secondaryHref="/"
        secondaryLabel="Home"
      />
    </div>
  );
}
