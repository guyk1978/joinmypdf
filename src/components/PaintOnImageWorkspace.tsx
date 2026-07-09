"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  clampBrushSize,
  DEFAULT_BRUSH_COLOR,
  DEFAULT_BRUSH_SIZE,
  drawImageOnCanvas,
  exportPaintedCanvas,
  getMousePos,
  isAcceptedImageFile,
  loadPaintImage,
  MAX_UNDO_STATES,
  paintOnImageOutputName,
  restoreCanvasSnapshot,
  canvasSnapshot,
  type LoadedPaintImage,
} from "@/lib/paint-on-image";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import {
  Brush,
  Download,
  Eraser,
  Palette,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif";

type DrawMode = "brush" | "eraser";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

export function PaintOnImageWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const t = useTranslations("PaintOnImage");
  const [loaded, setLoaded] = useState<LoadedPaintImage | null>(null);
  const [sourceFileName, setSourceFileName] = useState("");
  const [brushColor, setBrushColor] = useState(DEFAULT_BRUSH_COLOR);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const [drawMode, setDrawMode] = useState<DrawMode>("brush");
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const loadedRef = useRef<LoadedPaintImage | null>(null);
  const brushColorRef = useRef(brushColor);
  const brushSizeRef = useRef(brushSize);
  const drawModeRef = useRef(drawMode);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, loaded ? 1 : 0);
  const baseId = useId();

  brushColorRef.current = brushColor;
  brushSizeRef.current = brushSize;
  drawModeRef.current = drawMode;

  useEffect(() => {
    loadedRef.current = loaded;
  }, [loaded]);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  useEffect(() => {
    return () => {
      if (loadedRef.current?.objectUrl) {
        URL.revokeObjectURL(loadedRef.current.objectUrl);
      }
    };
  }, []);

  const pushUndo = useCallback((snapshot: string) => {
    setUndoStack((prev) => [...prev.slice(-(MAX_UNDO_STATES - 1)), snapshot]);
  }, []);

  const reset = useCallback(() => {
    if (loaded?.objectUrl) URL.revokeObjectURL(loaded.objectUrl);
    setLoaded(null);
    setSourceFileName("");
    setUndoStack([]);
    setStatus("");
    setDone(false);
    setRunError(null);
    drawingRef.current = false;
    lastPointRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;

      drawImageOnCanvas(canvas, loaded.image);
      setUndoStack([canvasSnapshot(canvas)]);
      setStatus(ws.wsStatus("ready"));
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
    // Only re-init when a new image is loaded — not when workspace i18n helpers change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded?.objectUrl]);

  const pickFile = async (file: File) => {
    if (!isAcceptedImageFile(file)) {
      setStatus(ws.wsStatus("noImages"));
      return;
    }

    setBusy(true);
    setRunError(null);
    setStatus(ws.wsStatus("loading"));

    try {
      if (loaded?.objectUrl) URL.revokeObjectURL(loaded.objectUrl);
      const paintImage = await loadPaintImage(file);
      setSourceFileName(file.name);
      setLoaded(paintImage);
      setDone(false);
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
      setStatus(ws.wsStatus("loaded", { name: file.name }));
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
    } finally {
      setBusy(false);
    }
  };

  const addFiles = (incoming: FileList | File[]) => {
    const accepted = Array.from(incoming || []).filter(isAcceptedImageFile);
    if (!accepted.length) {
      setStatus(ws.wsStatus("noImages"));
      return;
    }
    void pickFile(accepted[0]);
  };

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  };

  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = getCtx();
    if (!ctx) return;

    const mode = drawModeRef.current;
    const strokeStyle = mode === "eraser" ? "#000000" : brushColorRef.current;
    const strokeComposite = mode === "eraser" ? "destination-out" : "source-over";
    const size = brushSizeRef.current;

    ctx.save();
    ctx.globalCompositeOperation = strokeComposite;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  };

  const paintDot = (point: { x: number; y: number }) => {
    const ctx = getCtx();
    if (!ctx) return;

    const mode = drawModeRef.current;
    const strokeStyle = mode === "eraser" ? "#000000" : brushColorRef.current;
    const strokeComposite = mode === "eraser" ? "destination-out" : "source-over";
    const size = brushSizeRef.current;

    ctx.save();
    ctx.globalCompositeOperation = strokeComposite;
    ctx.fillStyle = strokeStyle;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const endStroke = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (canvas) {
      pushUndo(canvasSnapshot(canvas));
    }
  }, [pushUndo]);

  useEffect(() => {
    window.addEventListener("mouseup", endStroke);
    window.addEventListener("touchend", endStroke);
    return () => {
      window.removeEventListener("mouseup", endStroke);
      window.removeEventListener("touchend", endStroke);
    };
  }, [endStroke]);

  const onMouseDown = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    if (!loaded || busy || event.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    event.preventDefault();
    drawingRef.current = true;
    const point = getMousePos(canvas, event);
    lastPointRef.current = point;
    paintDot(point);
  };

  const onMouseMove = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !loaded) return;
    const canvas = canvasRef.current;
    if (!canvas || !lastPointRef.current) return;

    event.preventDefault();
    const point = getMousePos(canvas, event);
    drawLine(lastPointRef.current, point);
    lastPointRef.current = point;
  };

  const onMouseUp = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    endStroke();
  };

  const onTouchStart = (event: ReactTouchEvent<HTMLCanvasElement>) => {
    if (!loaded || busy) return;
    const canvas = canvasRef.current;
    const touch = event.touches[0];
    if (!canvas || !touch) return;

    event.preventDefault();
    drawingRef.current = true;
    const point = getMousePos(canvas, touch);
    lastPointRef.current = point;
    paintDot(point);
  };

  const onTouchMove = (event: ReactTouchEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !loaded) return;
    const canvas = canvasRef.current;
    const touch = event.touches[0];
    if (!canvas || !touch || !lastPointRef.current) return;

    event.preventDefault();
    const point = getMousePos(canvas, touch);
    drawLine(lastPointRef.current, point);
    lastPointRef.current = point;
  };

  const onTouchEnd = (event: ReactTouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    endStroke();
  };

  const onClearAll = async () => {
    if (!loaded || !canvasRef.current) return;
    drawImageOnCanvas(canvasRef.current, loaded.image);
    const snapshot = canvasSnapshot(canvasRef.current);
    setUndoStack([snapshot]);
    setStatus(ws.wsStatus("cleared"));
  };

  const onUndo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || undoStack.length <= 1) return;

    const nextStack = undoStack.slice(0, -1);
    const previous = nextStack[nextStack.length - 1];
    if (!previous) return;

    await restoreCanvasSnapshot(canvas, previous);
    setUndoStack(nextStack);
    setStatus(ws.wsStatus("undone"));
  };

  const onDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !loaded || busy) return;

    setBusy(true);
    setRunError(null);
    setStatus(ws.wsStatus("exporting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const blob = await exportPaintedCanvas(canvas);
      const downloadName = paintOnImageOutputName(sourceFileName || "image");

      downloadBlob(blob, downloadName);
      setDone(true);
      setStatus(ws.wsStatus("downloaded", { name: downloadName }));
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

  const showCanvas = Boolean(loaded);
  const canUndo = undoStack.length > 1;

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell>
        {!showCanvas ? (
          <>
            <ImageToolDropzone
              dropTitle={t("dropTitle")}
              selectLabel={t("selectFile")}
              selectAria={t("selectFileAria")}
              dropHint={t("dropHint")}
              supportedFormats={["JPG", "PNG", "WEBP", "HEIC", "GIF"]}
              accept={ACCEPT}
              multiple={false}
              disabled={busy}
              onFiles={addFiles}
            />
            <input
              id={`${baseId}-input`}
              ref={inputRef}
              type="file"
              className="sr-only"
              accept={ACCEPT}
              disabled={busy}
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) void pickFile(picked);
                e.target.value = "";
              }}
            />
          </>
        ) : null}
      </WorkspaceUploadShell>

      {showCanvas ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold text-ink">{t("canvasHint")}</p>
            <span className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-black dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <div className="relative overflow-hidden rounded-none border border-white/10 bg-black/40">
            <canvas
              ref={canvasRef}
              className="mx-auto block max-h-[min(70vh,720px)] w-full cursor-crosshair"
              style={{ width: "100%", height: "auto", touchAction: "none" }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onTouchCancel={onTouchEnd}
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
              <div className="pointer-events-auto flex w-full max-w-3xl flex-wrap items-center gap-3 rounded-none border border-neutral-700/80 bg-neutral-900/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-pressed={drawMode === "brush"}
                    title={t("brushTool")}
                    onClick={() => setDrawMode("brush")}
                    className={`rounded-none border p-2 transition ${
                      drawMode === "brush"
                        ? "border-neutral-500 bg-neutral-700 text-white"
                        : "border-white/10 text-neutral-300 hover:bg-white/5"
                    }`}
                  >
                    <Brush className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-pressed={drawMode === "eraser"}
                    title={t("eraserTool")}
                    onClick={() => setDrawMode("eraser")}
                    className={`rounded-none border p-2 transition ${
                      drawMode === "eraser"
                        ? "border-neutral-500 bg-neutral-700 text-white"
                        : "border-white/10 text-neutral-300 hover:bg-white/5"
                    }`}
                  >
                    <Eraser className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-neutral-200">
                  <Palette className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                  <span className="sr-only">{t("colorLabel")}</span>
                  <input
                    type="color"
                    value={brushColor}
                    disabled={drawMode === "eraser"}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded-none border border-white/15 bg-neutral-800 p-0.5 disabled:opacity-40"
                  />
                </label>

                <label className="flex min-w-[8rem] flex-1 items-center gap-2 text-xs font-medium text-neutral-200">
                  <span>{t("brushSizeLabel", { size: brushSize })}</span>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={brushSize}
                    onChange={(e) => setBrushSize(clampBrushSize(Number(e.target.value)))}
                    className="w-full accent-neutral-400"
                  />
                </label>

                <button
                  type="button"
                  disabled={!canUndo || busy}
                  onClick={() => void onUndo()}
                  className="inline-flex items-center gap-1.5 rounded-none border border-white/15 px-3 py-2 text-xs font-semibold text-neutral-200 transition hover:bg-white/5 disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  {t("undo")}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onClearAll()}
                  className="inline-flex items-center gap-1.5 rounded-none border border-white/15 px-3 py-2 text-xs font-semibold text-neutral-200 transition hover:bg-white/5 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  {t("clearAll")}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onDownload()}
                  className="inline-flex items-center gap-1.5 rounded-none border border-neutral-500 bg-neutral-200 px-3 py-2 text-xs font-semibold text-black transition hover:bg-white disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  {t("download")}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-none border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              {ws.chooseAnotherFile}
            </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
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
            setStatus(loaded ? ws.wsStatus("tryAgain") : "");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={inputRef.current?.files?.[0]} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={showCanvas ? t("download") : t("selectFile")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
