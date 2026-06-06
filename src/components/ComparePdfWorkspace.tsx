"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  comparePdfFiles,
  type CompareHighlight,
  type CompareProgress,
  type PdfCompareResult,
} from "@/lib/pdf-compare";
import { REDACT_UI_SCALE, renderPdfPageForUi } from "@/lib/pdf-redact";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

function acceptPdf(f: File) {
  return /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name);
}

function highlightStyle(kind: CompareHighlight["kind"]) {
  if (kind === "removed") return "bg-red-500/35 ring-1 ring-red-500/60";
  if (kind === "added") return "bg-emerald-500/35 ring-1 ring-emerald-500/60";
  return "bg-amber-400/35 ring-1 ring-amber-500/60";
}

function ComparePagePanel({
  label,
  file,
  pageIndex,
  highlights,
}: {
  label: string;
  file: File;
  pageIndex: number;
  highlights: CompareHighlight[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    let cancelled = false;
    void file.arrayBuffer().then((buf) => {
      if (!cancelled) setBytes(new Uint8Array(buf));
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!bytes) return;
    let cancelled = false;
    setLoading(true);
    void renderPdfPageForUi(bytes, pageIndex, undefined, REDACT_UI_SCALE).then(({ canvas }) => {
      if (cancelled) return;
      setCanvasEl(canvas);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [bytes, pageIndex]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/40"
      >
        {loading ? (
          <div className="flex aspect-[3/4] max-h-[70vh] items-center justify-center text-sm text-ink-muted">
            Rendering page…
          </div>
        ) : null}
        {canvasEl ? (
          <div className="relative mx-auto w-full max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={canvasEl.toDataURL("image/png")}
              alt={`${label} page ${pageIndex + 1}`}
              className="block h-auto w-full"
            />
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              {highlights.map((h, i) => (
                <span
                  key={`${h.kind}-${i}-${h.nx}-${h.ny}`}
                  className={`absolute rounded-sm ${highlightStyle(h.kind)}`}
                  style={{
                    left: `${h.nx * 100}%`,
                    top: `${h.ny * 100}%`,
                    width: `${h.nw * 100}%`,
                    height: `${h.nh * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FileSlot({
  id,
  label,
  file,
  onFile,
  onClear,
}: {
  id: string;
  label: string;
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const pick = (list: FileList | null) => {
    const f = list?.[0];
    if (f && acceptPdf(f)) onFile(f);
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e: DragEvent) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e: DragEvent) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          drag
            ? "border-brand bg-brand/10"
            : "border-white/15 bg-white/[0.02] hover:border-white/25"
        }`}
      >
        <input
          id={id}
          ref={inputRef}
          type="file"
          className="sr-only"
          accept="application/pdf,.pdf"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            pick(e.target.files);
            e.target.value = "";
          }}
        />
        {file ? (
          <p className="text-sm text-ink">
            <span className="font-medium">{file.name}</span>
            <span className="mt-1 block text-xs text-ink-muted">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </p>
        ) : (
          <p className="text-sm text-ink-muted">Drop a PDF here or click to browse</p>
        )}
      </div>
      {file ? (
        <button type="button" className={`${toolSecondaryBtn} self-start text-xs`} onClick={onClear}>
          Remove
        </button>
      ) : null}
    </div>
  );
}

export function ComparePdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const baseId = useId();
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [result, setResult] = useState<PdfCompareResult | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<CompareProgress | null>(null);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [showHighlights, setShowHighlights] = useState(true);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setLeftFile(null);
    setRightFile(null);
    setResult(null);
    setPageIndex(0);
    setStatus("");
    setProgress(null);
    setRunError(null);
    setBusy(false);
  }, []);

  const runCompare = async () => {
    if (!leftFile || !rightFile || busy) return;
    setBusy(true);
    setRunError(null);
    setResult(null);
    setPageIndex(0);
    setStatus(ws.wsStatus("comparing"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const compared = await comparePdfFiles(leftFile, rightFile, setProgress);
      setResult(compared);
      const diffPages = compared.pages.filter(
        (p) => p.leftHighlights.length || p.rightHighlights.length,
      ).length;
      setStatus(
        diffPages
          ? ws.wsStatus("foundDiffs", { diffPages, pageCount: compared.pageCount })
          : ws.wsStatus("noDiffs"),
      );
      capture(EVENTS.tool_run_success, {
        operation: tool.operation,
        slug,
        pages: compared.pageCount,
        diffPages,
      });
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
      setProgress(null);
    }
  };

  const canCompare = Boolean(leftFile && rightFile && !busy);
  const currentPage = result?.pages[pageIndex];
  const hasDiff = Boolean(
    currentPage?.leftHighlights.length || currentPage?.rightHighlights.length,
  );

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>Your files never leave your browser.</strong> Both PDFs are parsed with pdf.js
        locally—no upload to JoinMyPDF servers.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FileSlot
          id={`${baseId}-left`}
          label="Original (baseline)"
          file={leftFile}
          onFile={setLeftFile}
          onClear={() => {
            setLeftFile(null);
            setResult(null);
          }}
        />
        <FileSlot
          id={`${baseId}-right`}
          label="Revised (compare to)"
          file={rightFile}
          onFile={setRightFile}
          onClear={() => {
            setRightFile(null);
            setResult(null);
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={toolPrimaryBtn} disabled={!canCompare} onClick={() => void runCompare()}>
          {busy ? "Comparing…" : "Compare PDFs"}
        </button>
        {(leftFile || rightFile || result) && (
          <button type="button" className={toolSecondaryBtn} onClick={reset}>
            Clear all
          </button>
        )}
        {result ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              className="rounded border-white/20"
              checked={showHighlights}
              onChange={(e) => setShowHighlights(e.target.checked)}
            />
            Show highlights
          </label>
        ) : null}
      </div>

      {progress ? (
        <p className="text-sm text-ink-muted" role="status">
          {progress.phase === "loading"
            ? ws.wsProgress("loading")
            : ws.wsProgress("analyzingPage", {
                current: progress.currentPage,
                total: progress.totalPages,
              })}
        </p>
      ) : null}

      {status ? (
        <p className="text-sm text-ink" role="status">
          {status}
        </p>
      ) : null}

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => setRunError(null)}
        />
      ) : null}

      {result && leftFile && rightFile ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded bg-red-500/50 ring-1 ring-red-500/70" />
                Removed / original only
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded bg-emerald-500/50 ring-1 ring-emerald-500/70" />
                Added / revised only
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded bg-amber-400/50 ring-1 ring-amber-500/70" />
                Moved (same text, new position)
              </span>
            </div>
            <p className="text-sm text-ink-muted">
              Page {pageIndex + 1} of {result.pageCount}
              {result.leftPageCount !== result.rightPageCount
                ? ` · ${result.leftPageCount} vs ${result.rightPageCount} pages`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={toolSecondaryBtn}
              disabled={pageIndex <= 0}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            >
              Previous page
            </button>
            <button
              type="button"
              className={toolSecondaryBtn}
              disabled={pageIndex >= result.pageCount - 1}
              onClick={() => setPageIndex((p) => Math.min(result.pageCount - 1, p + 1))}
            >
              Next page
            </button>
            <select
              className="rounded-lg border border-white/15 bg-surface/60 px-3 py-2 text-sm text-ink"
              value={pageIndex}
              onChange={(e) => setPageIndex(Number(e.target.value))}
              aria-label="Jump to page"
            >
              {result.pages.map((_, i) => (
                <option key={i} value={i}>
                  Page {i + 1}
                  {result.pages[i].leftHighlights.length || result.pages[i].rightHighlights.length
                    ? " · has changes"
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {!hasDiff && showHighlights ? (
            <p className="text-sm text-ink-muted">No highlighted text differences on this page.</p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <ComparePagePanel
              label="Original"
              file={leftFile}
              pageIndex={pageIndex}
              highlights={showHighlights ? currentPage?.leftHighlights ?? [] : []}
            />
            <ComparePagePanel
              label="Revised"
              file={rightFile}
              pageIndex={pageIndex}
              highlights={showHighlights ? currentPage?.rightHighlights ?? [] : []}
            />
          </div>

          <PostSuccessUpsell operation={tool.operation} />
        </div>
      ) : null}

      <StickyMobileCta
        href="#tool-workspace"
        label="Compare PDFs"
        secondaryHref="/tools/pdf-merge/"
        secondaryLabel="Merge PDF"
      />
    </div>
  );
}
