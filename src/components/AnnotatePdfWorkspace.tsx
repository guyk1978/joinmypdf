"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PdfEditStudio, PdfStudioPage } from "@/components/PdfEditStudio";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import {
  ANNOTATE_UI_SCALE,
  DEFAULT_DRAW_COLOR,
  DEFAULT_HIGHLIGHT_COLOR,
  HIGHLIGHT_COLORS,
  STICKY_NOTE_STYLES,
  annotatePdfBytes,
  annotatePdfOutputName,
  createAnnotationId,
  drawAnnotationsOnCanvas,
  type PdfAnnotationBundle,
  type PdfDrawPoint,
  type PdfDrawStroke,
  type PdfHighlight,
  type PdfStickyNote,
  type StickyNoteColor,
} from "@/lib/pdf-annotate";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import * as pdf from "@/lib/pdf-engine";
import { loadPdfPageCount, renderPdfPageForUi } from "@/lib/pdf-redact";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import { clsx } from "clsx";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

type AnnotateTool = "highlight" | "draw" | "sticky";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

type HighlightDrag = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

function AnnotationPageStage({
  pageIndex,
  fileBytes,
  password,
  tool,
  highlightColor,
  drawColor,
  drawWidth,
  stickyColor,
  stickyText,
  bundle,
  activeStroke,
  highlightDraft,
  onHighlightDraft,
  onHighlightCommit,
  onStrokeStart,
  onStrokePoint,
  onStrokeEnd,
  onStickyPlace,
  loadingLabel,
  pageLabel,
}: {
  pageIndex: number;
  fileBytes: Uint8Array;
  password: string;
  tool: AnnotateTool;
  highlightColor: string;
  drawColor: string;
  drawWidth: number;
  stickyColor: StickyNoteColor;
  stickyText: string;
  bundle: PdfAnnotationBundle;
  activeStroke: PdfDrawPoint[] | null;
  highlightDraft: HighlightDrag | null;
  onHighlightDraft: (draft: HighlightDrag | null) => void;
  onHighlightCommit: (rect: PdfHighlight) => void;
  onStrokeStart: (point: PdfDrawPoint) => void;
  onStrokePoint: (point: PdfDrawPoint) => void;
  onStrokeEnd: () => void;
  onStickyPlace: (note: PdfStickyNote) => void;
  loadingLabel: string;
  pageLabel: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [baseCanvas, setBaseCanvas] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const drawingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const pendingPointRef = useRef<PdfDrawPoint | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void renderPdfPageForUi(fileBytes, pageIndex, password, ANNOTATE_UI_SCALE).then(({ canvas }) => {
      if (cancelled) return;
      setBaseCanvas(canvas);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fileBytes, pageIndex, password]);

  useEffect(() => {
    const baseEl = baseRef.current;
    if (!baseEl || !baseCanvas) return;
    baseEl.width = baseCanvas.width;
    baseEl.height = baseCanvas.height;
    const ctx = baseEl.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, baseEl.width, baseEl.height);
    ctx.drawImage(baseCanvas, 0, 0);
  }, [baseCanvas]);

  const redrawOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    const base = baseCanvas;
    if (!overlay || !base) return;
    overlay.width = base.width;
    overlay.height = base.height;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    drawAnnotationsOnCanvas(overlay, pageIndex, bundle);

    if (activeStroke && activeStroke.length >= 2) {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = Math.max(2, drawWidth * overlay.width);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(activeStroke[0].nx * overlay.width, activeStroke[0].ny * overlay.height);
      for (let i = 1; i < activeStroke.length; i += 1) {
        ctx.lineTo(activeStroke[i].nx * overlay.width, activeStroke[i].ny * overlay.height);
      }
      ctx.stroke();
    }

    if (highlightDraft) {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nx = Math.min(highlightDraft.startX, highlightDraft.currentX) / rect.width;
      const ny = Math.min(highlightDraft.startY, highlightDraft.currentY) / rect.height;
      const nw = Math.abs(highlightDraft.currentX - highlightDraft.startX) / rect.width;
      const nh = Math.abs(highlightDraft.currentY - highlightDraft.startY) / rect.height;
      ctx.fillStyle = `${highlightColor}66`;
      ctx.fillRect(nx * overlay.width, ny * overlay.height, nw * overlay.width, nh * overlay.height);
    }
  }, [activeStroke, baseCanvas, bundle, drawColor, drawWidth, highlightColor, highlightDraft, pageIndex]);

  useEffect(() => {
    redrawOverlay();
  }, [redrawOverlay]);

  const pointerNorm = (event: ReactPointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return { nx: 0, ny: 0, px: 0, py: 0 };
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    return { nx: clamp01(px / rect.width), ny: clamp01(py / rect.height), px, py };
  };

  const flushPoint = () => {
    if (pendingPointRef.current) {
      onStrokePoint(pendingPointRef.current);
      pendingPointRef.current = null;
    }
    rafRef.current = null;
  };

  const onPointerDown = (event: ReactPointerEvent) => {
    if (event.button !== 0) return;
    const { nx, ny, px, py } = pointerNorm(event);

    if (tool === "highlight") {
      onHighlightDraft({ startX: px, startY: py, currentX: px, currentY: py });
      return;
    }

    if (tool === "draw") {
      drawingRef.current = true;
      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
      onStrokeStart({ nx, ny });
      return;
    }

    if (tool === "sticky") {
      const text = stickyText.trim();
      if (!text) return;
      onStickyPlace({
        id: createAnnotationId(),
        pageIndex,
        nx: clamp01(nx - 0.08),
        ny: clamp01(ny - 0.04),
        nw: 0.22,
        nh: 0.14,
        text,
        color: stickyColor,
      });
    }
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    const { nx, ny, px, py } = pointerNorm(event);

    if (tool === "highlight" && highlightDraft) {
      onHighlightDraft({ ...highlightDraft, currentX: px, currentY: py });
      return;
    }

    if (tool === "draw" && drawingRef.current) {
      pendingPointRef.current = { nx, ny };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(flushPoint);
      }
    }
  };

  const onPointerUp = () => {
    if (tool === "highlight" && highlightDraft) {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (rect) {
        const nx = clamp01(Math.min(highlightDraft.startX, highlightDraft.currentX) / rect.width);
        const ny = clamp01(Math.min(highlightDraft.startY, highlightDraft.currentY) / rect.height);
        const nw = clamp01(Math.abs(highlightDraft.currentX - highlightDraft.startX) / rect.width);
        const nh = clamp01(Math.abs(highlightDraft.currentY - highlightDraft.startY) / rect.height);
        if (nw > 0.008 && nh > 0.008) {
          onHighlightCommit({ pageIndex, nx, ny, nw, nh, colorHex: highlightColor });
        }
      }
      onHighlightDraft(null);
      return;
    }

    if (tool === "draw" && drawingRef.current) {
      drawingRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        flushPoint();
      }
      onStrokeEnd();
    }
  };

  const cursorClass =
    tool === "draw"
      ? "cursor-crosshair"
      : tool === "highlight"
        ? "cursor-cell"
        : stickyText.trim()
          ? "cursor-copy"
          : "cursor-not-allowed";

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink">{pageLabel}</p>
      <PdfEditStudio minHeight="min-h-[280px]">
        <PdfStudioPage className="relative inline-block max-w-full">
          <div
            ref={wrapRef}
            className={clsx("relative touch-none select-none", cursorClass)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            role="presentation"
          >
            {loading || !baseCanvas ? (
              <div className="flex min-h-[240px] min-w-[200px] items-center justify-center text-sm text-black dark:text-neutral-200">
                {loadingLabel}
              </div>
            ) : (
              <>
                <canvas ref={baseRef} className="block max-h-[480px] max-w-full" />
                <canvas
                  ref={overlayRef}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                />
              </>
            )}
          </div>
        </PdfStudioPage>
      </PdfEditStudio>
    </div>
  );
}

const EMPTY_BUNDLE: PdfAnnotationBundle = { highlights: [], strokes: [], stickies: [] };

export function AnnotatePdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [password, setPassword] = useState("");
  const [encrypted, setEncrypted] = useState(false);
  const [annotateTool, setAnnotateTool] = useState<AnnotateTool>("highlight");
  const [highlightColor, setHighlightColor] = useState(DEFAULT_HIGHLIGHT_COLOR);
  const [drawColor, setDrawColor] = useState(DEFAULT_DRAW_COLOR);
  const [drawWidth, setDrawWidth] = useState(0.004);
  const [stickyColor, setStickyColor] = useState<StickyNoteColor>("yellow");
  const [stickyText, setStickyText] = useState("");
  const [bundle, setBundle] = useState<PdfAnnotationBundle>(EMPTY_BUNDLE);
  const [history, setHistory] = useState<PdfAnnotationBundle[]>([]);
  const [activeStroke, setActiveStroke] = useState<PdfDrawPoint[] | null>(null);
  const [highlightDraft, setHighlightDraft] = useState<HighlightDrag | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const activeStrokeIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const pushHistory = useCallback((prev: PdfAnnotationBundle) => {
    setHistory((h) => [...h.slice(-49), prev]);
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setPageIndex(0);
    setPassword("");
    setEncrypted(false);
    setBundle(EMPTY_BUNDLE);
    setHistory([]);
    setActiveStroke(null);
    setHighlightDraft(null);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setBundle(prev);
    setStatus(ws.wsStatus("undone"));
  };

  const addFile = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming || []).filter((f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
      if (!list.length) {
        setStatus(ws.status("chooseValidPdf"));
        return;
      }
      const picked = list[0];
      const bytes = new Uint8Array(await picked.arrayBuffer());
      setFile(picked);
      setFileBytes(bytes);
      setBundle(EMPTY_BUNDLE);
      setHistory([]);
      setPageIndex(0);
      setDone(false);
      setRunError(null);
      setPassword("");

      try {
        setEncrypted(await pdf.isPdfEncrypted(picked));
      } catch {
        setEncrypted(false);
      }

      try {
        const count = await loadPdfPageCount(bytes, "");
        setPageCount(count);
        setStatus(ws.wsStatus("loaded", { count }));
      } catch {
        setPageCount(0);
        setStatus(ws.wsStatus("couldNotOpen"));
      }

      capture(EVENTS.file_selected, { count: 1, operation: tool.operation });
    },
    [tool.operation, ws],
  );

  const onDownload = async () => {
    if (!file || !fileBytes || busy) return;
    const hasAny =
      bundle.highlights.length > 0 || bundle.strokes.length > 0 || bundle.stickies.length > 0;
    if (!hasAny) {
      setStatus(ws.wsStatus("addAnnotation"));
      return;
    }
    if (encrypted && !password.trim()) {
      setStatus(ws.wsStatus("enterPassword"));
      return;
    }

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("applying"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await annotatePdfBytes(fileBytes, bundle, { password });
      const outName = annotatePdfOutputName(file.name);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(ws.wsStatus("downloaded", { name: outName }));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      capture(EVENTS.download_click, { operation: tool.operation, slug });
      window.setTimeout(() => dispatchToolComplete({ operation: tool.operation, slug }), 400);
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

  const annotationCount =
    bundle.highlights.length + bundle.strokes.length + bundle.stickies.length;

  return (
    <div id="tool-workspace" className="tool-workspace--wide space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell active={Boolean(file)}>
        {!file ? (
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
              void addFile(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            input={
              <input
                id={`${baseId}-input`}
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) void addFile(e.target.files);
                  e.target.value = "";
                }}
              />
            }
          />
        ) : null}
      </WorkspaceUploadShell>

      {file ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="truncate text-sm text-ink-muted">
                <span className="font-medium text-ink">{file.name}</span>
              </p>
              <button type="button" onClick={reset} disabled={busy} className={toolSecondaryBtn}>
                {ws.chooseAnotherFile}
              </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
            </div>

            {encrypted ? (
              <div className="protect-form">
                <label className="protect-form__label" htmlFor={`${baseId}-password`}>
                  {ws.wsUi("passwordLabel")}
                </label>
                <input
                  id={`${baseId}-password`}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="protect-form__input"
                  autoComplete="off"
                />
              </div>
            ) : null}

            <div className="grid gap-3 rounded-none border border-neutral-400/30 bg-neutral-500/[0.06] p-4 ring-1 ring-neutral-400/20 backdrop-blur-md dark:border-neutral-400/40 dark:bg-neutral-500/10">
              <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label={ws.wsUi("toolbarLabel")}>
                {(["highlight", "draw", "sticky"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={busy}
                    onClick={() => setAnnotateTool(t)}
                    className={clsx(
                      "rounded-none border px-3 py-2 text-sm font-semibold transition",
                      annotateTool === t
                        ? "border-neutral-400/60 bg-neutral-500/20 text-ink"
                        : "border-white/15 text-ink hover:bg-white/5",
                    )}
                  >
                    {ws.wsUi(`tool_${t}`)}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={busy || !history.length}
                  onClick={undo}
                  className="rounded-none border border-white/15 px-3 py-2 text-sm font-semibold text-ink hover:bg-white/5 disabled:opacity-50"
                  aria-label={ws.wsUi("undoLabel")}
                >
                  {ws.wsUi("undoLabel")}
                </button>
              </div>

              {annotateTool === "highlight" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-ink">{ws.wsUi("colorLabel")}</span>
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-label={c.id}
                      className={clsx(
                        "h-7 w-7 rounded-none border-2",
                        highlightColor === c.hex ? "border-ink scale-110" : "border-transparent",
                      )}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => setHighlightColor(c.hex)}
                    />
                  ))}
                </div>
              ) : null}

              {annotateTool === "draw" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="font-semibold text-ink">{ws.wsUi("colorLabel")}</span>
                    <input
                      type="color"
                      value={drawColor}
                      onChange={(e) => setDrawColor(e.target.value)}
                      className="mt-1 h-10 w-full"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-semibold text-ink">{ws.wsUi("thicknessLabel")}</span>
                    <input
                      type="range"
                      min={0.002}
                      max={0.012}
                      step={0.001}
                      value={drawWidth}
                      onChange={(e) => setDrawWidth(Number(e.target.value))}
                      className="mt-2 w-full"
                    />
                  </label>
                </div>
              ) : null}

              {annotateTool === "sticky" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm md:col-span-2">
                    <span className="font-semibold text-ink">{ws.wsUi("stickyTextLabel")}</span>
                    <textarea
                      value={stickyText}
                      onChange={(e) => setStickyText(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-none border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      placeholder={ws.wsUi("stickyTextPlaceholder")}
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                    <span className="text-xs font-semibold text-ink">{ws.wsUi("stickyColorLabel")}</span>
                    {(Object.keys(STICKY_NOTE_STYLES) as StickyNoteColor[]).map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={clsx(
                          "rounded-none border-2 px-3 py-1.5 text-xs font-semibold",
                          stickyColor === color ? "border-ink" : "border-transparent",
                        )}
                        style={{
                          backgroundColor: STICKY_NOTE_STYLES[color].fill,
                          color: STICKY_NOTE_STYLES[color].text,
                        }}
                        onClick={() => setStickyColor(color)}
                      >
                        {ws.wsUi(`sticky_${color}`)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <p className="text-xs text-ink-muted">{ws.wsUi(`hint_${annotateTool}`)}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-semibold text-ink">
                {ws.wsUi("pageLabel")}
                <select
                  value={pageIndex}
                  onChange={(e) => setPageIndex(Number(e.target.value))}
                  className="ml-2 rounded-none border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  {Array.from({ length: pageCount }, (_, i) => (
                    <option key={i} value={i}>
                      {ws.wsUi("pageOption", { page: i + 1 })}
                    </option>
                  ))}
                </select>
              </label>
              <span className="text-xs text-ink-muted">
                {ws.wsUi("annotationCount", { count: annotationCount })}
              </span>
            </div>

            {fileBytes ? (
              <AnnotationPageStage
                pageIndex={pageIndex}
                fileBytes={fileBytes}
                password={password}
                tool={annotateTool}
                highlightColor={highlightColor}
                drawColor={drawColor}
                drawWidth={drawWidth}
                stickyColor={stickyColor}
                stickyText={stickyText}
                bundle={bundle}
                activeStroke={activeStroke}
                highlightDraft={highlightDraft}
                onHighlightDraft={setHighlightDraft}
                onHighlightCommit={(rect) => {
                  pushHistory(bundle);
                  setBundle((b) => ({ ...b, highlights: [...b.highlights, rect] }));
                  setStatus(ws.wsStatus("highlightAdded"));
                }}
                onStrokeStart={(point) => {
                  pushHistory(bundle);
                  activeStrokeIdRef.current = createAnnotationId();
                  setActiveStroke([point]);
                }}
                onStrokePoint={(point) => {
                  setActiveStroke((prev) => (prev ? [...prev, point] : [point]));
                }}
                onStrokeEnd={() => {
                  const id = activeStrokeIdRef.current;
                  setActiveStroke((prev) => {
                    if (id && prev && prev.length >= 2) {
                      const stroke: PdfDrawStroke = {
                        id,
                        pageIndex,
                        colorHex: drawColor,
                        lineWidth: drawWidth,
                        points: prev,
                      };
                      setBundle((b) => ({ ...b, strokes: [...b.strokes, stroke] }));
                      setStatus(ws.wsStatus("strokeAdded"));
                    }
                    return null;
                  });
                  activeStrokeIdRef.current = null;
                }}
                onStickyPlace={(note) => {
                  pushHistory(bundle);
                  setBundle((b) => ({ ...b, stickies: [...b.stickies, note] }));
                  setStatus(ws.wsStatus("stickyAdded"));
                }}
                loadingLabel={ws.wsUi("loadingPreview")}
                pageLabel={ws.wsCommon("pageNumber", { page: pageIndex + 1 })}
              />
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button type="button" className={toolPrimaryBtn} disabled={busy} onClick={() => void onDownload()}>
                {ws.buttonLabel()}
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
            setStatus(ws.wsStatus("adjustFile"));
          }}
        />
      ) : status ? (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}
      <StickyMobileCta
        href="#tool-workspace"
        label={ws.buttonLabel()}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
