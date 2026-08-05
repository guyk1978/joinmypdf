"use client";

import { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";
import type { WorkspaceProjectRestorePayload } from "@/components/WorkspaceProjectControls";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone"
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell"
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PdfEditStudio, PdfStudioPage } from "@/components/PdfEditStudio";
import { PdfPagePreviewModal } from "@/components/PdfPagePreviewModal";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  clampCropRect,
  cropPdfBytes,
  cropPdfOutputName,
  DEFAULT_CROP_RECT,
  type NormalizedCropRect,
} from "@/lib/crop-pdf";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { usePdfStudioPage } from "@/hooks/usePdfStudioPage";
import { blitCanvas } from "@/lib/pdf-render";
import { loadPdfPageCount, REDACT_UI_SCALE } from "@/lib/pdf-redact";
import { registerPreviewInspectSource } from "@/lib/preview-inspect";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";
import { ZoomIn } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

type HandleId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "move";

type DragMode = {
  handle: HandleId;
  startRect: NormalizedCropRect;
  startX: number;
  startY: number;
};

const MIN_FRACTION = 0.05;

const HANDLE_CURSORS: Record<HandleId, string> = {
  nw: "nwse-resize",
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize",
  move: "move",
};

function hitHandle(
  rect: NormalizedCropRect,
  px: number,
  py: number,
  w: number,
  h: number,
): HandleId | null {
  const x = px / w;
  const y = py / h;
  const edge = 0.04;
  const left = rect.nx;
  const right = rect.nx + rect.nw;
  const top = rect.ny;
  const bottom = rect.ny + rect.nh;
  const onLeft = Math.abs(x - left) < edge;
  const onRight = Math.abs(x - right) < edge;
  const onTop = Math.abs(y - top) < edge;
  const onBottom = Math.abs(y - bottom) < edge;
  const insideX = x >= left && x <= right;
  const insideY = y >= top && y <= bottom;

  if (onTop && onLeft) return "nw";
  if (onTop && onRight) return "ne";
  if (onBottom && onLeft) return "sw";
  if (onBottom && onRight) return "se";
  if (onTop && insideX) return "n";
  if (onBottom && insideX) return "s";
  if (onLeft && insideY) return "w";
  if (onRight && insideY) return "e";
  if (insideX && insideY) return "move";
  return null;
}

function resizeRect(
  start: NormalizedCropRect,
  handle: HandleId,
  dx: number,
  dy: number,
): NormalizedCropRect {
  let { nx, ny, nw, nh } = start;
  const right = nx + nw;
  const bottom = ny + nh;

  if (handle === "move") {
    return clampCropRect({ nx: nx + dx, ny: ny + dy, nw, nh });
  }

  if (handle.includes("w")) {
    nx = Math.min(nx + dx, right - MIN_FRACTION);
    nw = right - nx;
  }
  if (handle.includes("e")) {
    nw = Math.max(MIN_FRACTION, nw + dx);
  }
  if (handle.includes("n")) {
    ny = Math.min(ny + dy, bottom - MIN_FRACTION);
    nh = bottom - ny;
  }
  if (handle.includes("s")) {
    nh = Math.max(MIN_FRACTION, nh + dy);
  }

  return clampCropRect({ nx, ny, nw, nh });
}

function CropPreview({
  fileBytes,
  crop,
  onCropChange,
  cropInstructions,
  loadingPreviewLabel,
  openPreviewLabel,
  onOpenPreview,
}: {
  fileBytes: Uint8Array;
  crop: NormalizedCropRect;
  onCropChange: (next: NormalizedCropRect) => void;
  cropInstructions: string;
  loadingPreviewLabel: string;
  openPreviewLabel: string;
  onOpenPreview: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { canvas: pageCanvas, loading, errorMessage, failed } = usePdfStudioPage({
    fileBytes,
    pageIndex: 0,
    scale: REDACT_UI_SCALE,
  });
  const dragRef = useRef<DragMode | null>(null);

  useEffect(() => {
    if (!pageCanvas || !displayCanvasRef.current) return;
    blitCanvas(pageCanvas, displayCanvasRef.current);
  }, [pageCanvas]);

  useEffect(() => {
    if (!pageCanvas) return;
    return registerPreviewInspectSource({
      id: "crop-pdf-preview",
      getPriority: () => 100,
      isAvailable: () => Boolean(displayCanvasRef.current || pageCanvas),
      capture: () => {
        const source = displayCanvasRef.current ?? pageCanvas;
        try {
          return source.toDataURL("image/png");
        } catch {
          return null;
        }
      },
      label: openPreviewLabel,
    });
  }, [pageCanvas, openPreviewLabel]);

  const pointerPos = (event: ReactPointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: ReactPointerEvent) => {
    const el = wrapRef.current;
    if (!el) return;
    const { x, y } = pointerPos(event);
    const handle = hitHandle(crop, x, y, el.clientWidth, el.clientHeight);
    if (!handle) return;
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    dragRef.current = { handle, startRect: crop, startX: x, startY: y };
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    const mode = dragRef.current;
    const el = wrapRef.current;
    if (!mode || !el) return;
    const { x, y } = pointerPos(event);
    const dx = (x - mode.startX) / el.clientWidth;
    const dy = (y - mode.startY) / el.clientHeight;
    onCropChange(resizeRect(mode.startRect, mode.handle, dx, dy));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const boxStyle: CSSProperties = {
    left: `${crop.nx * 100}%`,
    top: `${crop.ny * 100}%`,
    width: `${crop.nw * 100}%`,
    height: `${crop.nh * 100}%`,
    // Dim only outside the crop frame — keep the kept region fully bright.
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.28)",
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-700 dark:text-neutral-200">{cropInstructions}</p>
        <button
          type="button"
          className={toolOutlineBtn}
          onClick={onOpenPreview}
          disabled={loading || failed || !pageCanvas}
        >
          <ZoomIn className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          {openPreviewLabel}
        </button>
      </div>
      <PdfEditStudio minHeight={loading ? "min-h-[320px]" : undefined}>
        <PdfStudioPage className="mx-auto max-w-full" magnifier={false}>
          <div
            ref={wrapRef}
            className="relative touch-none select-none overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {loading ? (
              <div className="flex min-h-[280px] min-w-[200px] items-center justify-center text-sm text-neutral-600 dark:text-neutral-300">
                {loadingPreviewLabel}
              </div>
            ) : null}
            {failed ? (
              <div
                className="flex min-h-[280px] min-w-[200px] items-center justify-center text-sm text-neutral-600 dark:text-neutral-300"
                role="alert"
              >
                {errorMessage}
              </div>
            ) : null}
            {pageCanvas ? (
              <canvas
                ref={displayCanvasRef}
                className="block h-auto max-w-full"
              />
            ) : null}
            {!loading ? (
              <>
                <div
                  className="pointer-events-none absolute border-2 border-sky-400"
                  style={boxStyle}
                />
                {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const).map((handle) => {
                  const style: CSSProperties = { cursor: HANDLE_CURSORS[handle] };
                  if (handle === "nw") Object.assign(style, { left: boxStyle.left, top: boxStyle.top });
                  if (handle === "n")
                    Object.assign(style, {
                      left: `calc(${crop.nx * 100}% + ${(crop.nw * 100) / 2}% - 6px)`,
                      top: boxStyle.top,
                    });
                  if (handle === "ne")
                    Object.assign(style, {
                      left: `calc(${(crop.nx + crop.nw) * 100}% - 12px)`,
                      top: boxStyle.top,
                    });
                  if (handle === "e")
                    Object.assign(style, {
                      left: `calc(${(crop.nx + crop.nw) * 100}% - 12px)`,
                      top: `calc(${crop.ny * 100}% + ${(crop.nh * 100) / 2}% - 6px)`,
                    });
                  if (handle === "se")
                    Object.assign(style, {
                      left: `calc(${(crop.nx + crop.nw) * 100}% - 12px)`,
                      top: `calc(${(crop.ny + crop.nh) * 100}% - 12px)`,
                    });
                  if (handle === "s")
                    Object.assign(style, {
                      left: `calc(${crop.nx * 100}% + ${(crop.nw * 100) / 2}% - 6px)`,
                      top: `calc(${(crop.ny + crop.nh) * 100}% - 12px)`,
                    });
                  if (handle === "sw")
                    Object.assign(style, {
                      left: boxStyle.left,
                      top: `calc(${(crop.ny + crop.nh) * 100}% - 12px)`,
                    });
                  if (handle === "w")
                    Object.assign(style, {
                      left: boxStyle.left,
                      top: `calc(${crop.ny * 100}% + ${(crop.nh * 100) / 2}% - 6px)`,
                    });
                  return (
                    <span
                      key={handle}
                      className="absolute z-10 h-3 w-3 rounded-none border-2 border-sky-400 bg-white"
                      style={style}
                      aria-hidden
                    />
                  );
                })}
              </>
            ) : null}
          </div>
        </PdfStudioPage>
      </PdfEditStudio>
    </div>
  );
}

export function CropPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [crop, setCrop] = useState<NormalizedCropRect>(DEFAULT_CROP_RECT);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file && fileBytes));
  const baseId = useId();

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setCrop(DEFAULT_CROP_RECT);
    setStatus("");
    setDone(false);
    setRunError(null);
    setPreviewOpen(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = useCallback(
    async (next: File, restoreCrop?: NormalizedCropRect) => {
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
      setPreviewOpen(false);
      setStatus(ws.wsStatus("reading"));
      try {
        const bytes = new Uint8Array(await next.arrayBuffer());
        const count = await loadPdfPageCount(bytes);
        setFile(next);
        setFileBytes(bytes);
        setPageCount(count);
        setCrop(restoreCrop ? clampCropRect(restoreCrop) : DEFAULT_CROP_RECT);
        setStatus(ws.wsStatus("fileReady", { name: next.name }));
        capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
      } catch (e) {
        const parsed = classifyPdfError(e);
        setRunError(parsed);
        setStatus("");
        setFile(null);
        setFileBytes(null);
      } finally {
        setBusy(false);
      }
    },
    [acceptPdf, tool.operation, ws.wsStatus],
  );

  const onApply = async () => {
    if (!file) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("cropping"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });
    try {
      const bytes = await cropPdfBytes(file, crop);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), cropPdfOutputName(file));
      setDone(true);
      setStatus(ws.wsStatus("complete"));
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

  const showWorkspace = Boolean(file && fileBytes);

  const onRestoreProject = useCallback(
    (payload: WorkspaceProjectRestorePayload) => {
      const next = payload.files[0];
      if (!next) return;
      const saved = payload.settings?.crop;
      const restoreCrop =
        saved &&
        typeof saved === "object" &&
        saved !== null &&
        "nx" in saved &&
        "ny" in saved &&
        "nw" in saved &&
        "nh" in saved
          ? clampCropRect(saved as NormalizedCropRect)
          : undefined;
      void pickFile(next, restoreCrop);
    },
    [pickFile],
  );

  useWorkspaceProjectBridge({
    files: file ? [file] : [],
    settings: { crop },
    disabled: !file || busy,
    onRestore: onRestoreProject,
  });

  const openPreviewLabel = ws.wsUi("openPreview") || ws.wsCommon("openPreview") || "Zoom preview";

  return (
    <div id="tool-workspace" className="crop-pdf-tool-page tool-workspace--wide space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell active={showWorkspace}>
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

      {showWorkspace && fileBytes ? (
        <div
          id={WORKSPACE_OPERATIONS_ID}
          className="tool-workspace-panel space-y-3"
          data-embed-measure=""
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{file?.name}</p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                {ws.wsUi("pageSummary", { count: pageCount })}
              </p>
            </div>
            <span className="rounded-none border border-neutral-400 bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-800 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-100">
              {ws.clientSideOnly}
            </span>
          </div>

          <CropPreview
            fileBytes={fileBytes}
            crop={crop}
            onCropChange={setCrop}
            cropInstructions={ws.wsUi("cropInstructions")}
            loadingPreviewLabel={ws.wsCommon("loadingPreview")}
            openPreviewLabel={openPreviewLabel}
            onOpenPreview={() => setPreviewOpen(true)}
          />

          <PdfPagePreviewModal
            open={previewOpen}
            fileBytes={fileBytes}
            pageIndex={0}
            title={
              ws.wsCommon("pageOf", { current: 1, total: Math.max(pageCount, 1) }) ||
              `Page 1 of ${Math.max(pageCount, 1)}`
            }
            closeLabel={ws.wsCommon("closePagePreview") || "Close page preview"}
            loadingLabel={ws.wsCommon("loadingPagePreview") || ws.wsCommon("loadingPreview")}
            zoomInLabel={ws.wsCommon("zoomIn") || "Zoom in"}
            zoomOutLabel={ws.wsCommon("zoomOut") || "Zoom out"}
            onClose={() => setPreviewOpen(false)}
          />

          {busy ? (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                <span>{ws.processing}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-none bg-neutral-200 dark:bg-neutral-800">
                <div className="h-full w-2/3 animate-pulse rounded-none bg-neutral-600 dark:bg-neutral-300" />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3" data-workspace-actions="">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onApply()}
              className={toolPrimaryBtn}
            >
              {ws.wsText("applyLabel")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setCrop(DEFAULT_CROP_RECT)}
              className={toolOutlineBtn}
            >
              {ws.wsUi("resetFrame")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className={toolOutlineBtn}
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
            setStatus(file ? ws.wsStatus("tryAgain") : "");
          }}
        />
      ) : (
        <p className="text-sm text-neutral-700 dark:text-neutral-300" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={showWorkspace ? ws.wsText("stickyApplyLabel") : ws.wsText("stickyDefaultLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
