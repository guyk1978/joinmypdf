"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import type { ToolDefinition } from "@/lib/types";
import { rotatePdfBytes, rotatePdfOutputName, type PageRotationAdjustment } from "@/lib/rotate-pdf";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

type Thumb = { pageIndex: number; dataUrl: string };

const RIGHT: 90 = 90;
const LEFT: -90 = -90;

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function normalizeRightAngle(angle: number): 0 | 90 | 180 | 270 {
  const normalized = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) return normalized;
  return 0;
}

async function setupPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

async function renderThumbnails(data: Uint8Array): Promise<Thumb[]> {
  const pdfjs = await setupPdfJs();
  const doc = await pdfjs.getDocument({ data: data.slice() }).promise;
  const thumbs: Thumb[] = [];
  const scale = 0.26;

  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");
    await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;
    thumbs.push({ pageIndex: i - 1, dataUrl: canvas.toDataURL("image/jpeg", 0.9) });
  }

  return thumbs;
}

export function RotatePdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [rotations, setRotations] = useState<Record<number, 0 | 90 | 180 | 270>>({});
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
    setFileBytes(null);
    setThumbs([]);
    setRotations({});
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const rotateOne = (pageIndex: number, delta: 90 | -90) => {
    setRotations((prev) => {
      const next = { ...prev };
      next[pageIndex] = normalizeRightAngle((next[pageIndex] || 0) + delta);
      return next;
    });
  };

  const rotateAll = (delta: 90 | -90) => {
    setRotations((prev) => {
      const next = { ...prev };
      for (const page of thumbs) {
        next[page.pageIndex] = normalizeRightAngle((next[page.pageIndex] || 0) + delta);
      }
      return next;
    });
  };

  const pickFile = async (next: File) => {
    if (!acceptPdf(next)) {
      setStatus(ws.wsStatus("invalidType"));
      return;
    }
    if (next.size === 0) {
      setStatus(ws.wsStatus("emptyFile"));
      return;
    }

    setBusy(true);
    setRunError(null);
    setDone(false);
    setStatus(ws.wsStatus("reading"));

    try {
      const bytes = new Uint8Array(await next.arrayBuffer());
      const rendered = await renderThumbnails(bytes);
      setFile(next);
      setFileBytes(bytes);
      setThumbs(rendered);
      setRotations({});
      setStatus(ws.wsStatus("fileReady", { name: next.name }));
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (error) {
      const parsed = classifyPdfError(error);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setFileBytes(null);
      setThumbs([]);
    } finally {
      setBusy(false);
    }
  };

  const adjustments = useMemo<PageRotationAdjustment[]>(
    () =>
      Object.entries(rotations)
        .map(([pageIndex, angle]) => ({
          pageIndex: Number(pageIndex),
          delta: angle as 0 | 90 | 180 | 270,
        }))
        .filter((entry) => entry.delta !== 0),
    [rotations],
  );

  const onApply = async () => {
    if (!file || !fileBytes) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("applying"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await rotatePdfBytes(file, adjustments);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), rotatePdfOutputName(file));
      setDone(true);
      setStatus(ws.wsStatus("complete"));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      capture(EVENTS.download_click, { operation: tool.operation, slug });
      window.setTimeout(() => dispatchToolComplete({ operation: tool.operation, slug }), 400);
    } catch (error) {
      const parsed = classifyPdfError(error);
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

  const showWorkspace = Boolean(file && fileBytes);

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell>
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
      </WorkspaceUploadShell>

      {showWorkspace ? (
        <div className="space-y-2 rounded-none border border-white/10 bg-white/[0.02] p-3 md:p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{file?.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {ws.wsUi("pageSummary", { count: thumbs.length })}
              </p>
            </div>
            <span className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-black dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !thumbs.length}
              onClick={() => rotateAll(RIGHT)}
              className="rounded-none border border-white/15 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              {ws.wsUi("rotateAllCw")}
            </button>
            <button
              type="button"
              disabled={busy || !thumbs.length}
              onClick={() => rotateAll(LEFT)}
              className="rounded-none border border-white/15 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              {ws.wsUi("rotateAllCcw")}
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {thumbs.map((thumb) => {
              const angle = rotations[thumb.pageIndex] || 0;
              return (
                <article
                  key={thumb.pageIndex}
                  className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-white p-3 transition hover:border-neutral-300 dark:border-neutral-800 dark:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-200 dark:bg-neutral-900 dark:hover:border-neutral-300 dark:border-neutral-800"
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">
                    <span>{ws.wsCommon("pageNumber", { page: thumb.pageIndex + 1 })}</span>
                    <span>{angle}°</span>
                  </div>
                  <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-none border border-neutral-300 bg-neutral-100 p-2 dark:border-neutral-800 dark:bg-neutral-950">
                    <img
                      src={thumb.dataUrl}
                      alt={ws.wsCommon("pageNumber", { page: thumb.pageIndex + 1 })}
                      className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out dark:shadow-none"
                      style={{ transform: `rotate(${angle}deg)` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => rotateOne(thumb.pageIndex, RIGHT)}
                      className="rounded-none border border-white/15 px-2 py-2 text-xs font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
                    >
                      {ws.wsUi("clockwise")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => rotateOne(thumb.pageIndex, LEFT)}
                      className="rounded-none border border-white/15 px-2 py-2 text-xs font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
                    >
                      {ws.wsUi("counterClockwise")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {busy ? (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>{status || ws.processing}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-none bg-white/10">
                <div className="h-full w-2/3 animate-pulse rounded-none bg-neutral-700 dark:bg-neutral-300" />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || !thumbs.length}
              onClick={() => void onApply()}
              className={toolPrimaryBtn}
            >
              {ws.wsText("saveLabel")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setRotations({})}
              className="rounded-none border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              {ws.wsUi("resetRotations")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-none border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              {ws.chooseAnotherFile}
            </button>
          </div>
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
        label={showWorkspace ? ws.wsText("saveLabel") : ws.wsText("rotateLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
