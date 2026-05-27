"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
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
import { loadPdfPageCount, REDACT_UI_SCALE, renderPdfPageForUi } from "@/lib/pdf-redact";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
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
}: {
  fileBytes: Uint8Array;
  crop: NormalizedCropRect;
  onCropChange: (next: NormalizedCropRect) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const dragRef = useRef<DragMode | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void renderPdfPageForUi(fileBytes, 0, undefined, REDACT_UI_SCALE).then(({ canvas }) => {
      if (cancelled) return;
      setCanvasEl(canvas);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fileBytes]);

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

  const boxStyle = {
    left: `${crop.nx * 100}%`,
    top: `${crop.ny * 100}%`,
    width: `${crop.nw * 100}%`,
    height: `${crop.nh * 100}%`,
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">
        Drag the frame to move it. Pull corners or edges to resize. The same crop applies to every page.
      </p>
      <div
        ref={wrapRef}
        className="relative mx-auto max-w-full overflow-hidden rounded-xl border border-white/10 bg-surface/30 touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center text-sm text-ink-muted">
            Loading preview…
          </div>
        ) : null}
        {canvasEl ? (
          <canvas
            ref={(node) => {
              if (node && canvasEl) {
                node.width = canvasEl.width;
                node.height = canvasEl.height;
                const ctx = node.getContext("2d");
                if (ctx) ctx.drawImage(canvasEl, 0, 0);
              }
            }}
            className="block h-auto max-w-full"
          />
        ) : null}
        {!loading ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden />
            <div
              className="pointer-events-none absolute border-2 border-brand shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
              style={boxStyle}
            />
            {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const).map((handle) => {
              const style: React.CSSProperties = { cursor: HANDLE_CURSORS[handle] };
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
                  className="absolute z-10 h-3 w-3 rounded-full border-2 border-brand bg-surface shadow"
                  style={style}
                  aria-hidden
                />
              );
            })}
          </>
        ) : null}
      </div>
    </div>
  );
}

export function CropPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [crop, setCrop] = useState<NormalizedCropRect>(DEFAULT_CROP_RECT);
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
    setPageCount(0);
    setCrop(DEFAULT_CROP_RECT);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (next: File) => {
    if (!acceptPdf(next)) {
      setStatus("Please choose a PDF file.");
      return;
    }
    if (next.size === 0) {
      setStatus("That file is empty. Choose another PDF.");
      return;
    }
    setBusy(true);
    setRunError(null);
    setDone(false);
    setStatus("Reading PDF…");
    try {
      const bytes = new Uint8Array(await next.arrayBuffer());
      const count = await loadPdfPageCount(bytes);
      setFile(next);
      setFileBytes(bytes);
      setPageCount(count);
      setCrop(DEFAULT_CROP_RECT);
      setStatus(`${next.name} ready — adjust the crop frame, then apply.`);
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
  };

  const onApply = async () => {
    if (!file) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus("Cropping pages…");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });
    try {
      const bytes = await cropPdfBytes(file, crop);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), cropPdfOutputName(file));
      setDone(true);
      setStatus("Crop complete. Your download should start automatically.");
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

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Secure:</strong> Cropping runs entirely in your browser. Your PDF never leaves your device.
      </div>

      {!showWorkspace ? (
        <FileUploadZone
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title="Drop a PDF here or click to browse"
          description="Crop margins on every page using a visual frame on page 1."
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

      {showWorkspace && fileBytes ? (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">{file?.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {pageCount} page{pageCount === 1 ? "" : "s"} · same crop on all pages
              </p>
            </div>
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              Client-side only
            </span>
          </div>

          <CropPreview fileBytes={fileBytes} crop={crop} onCropChange={setCrop} />

          {busy ? (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>Processing…</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-brand to-brand-deep" />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onApply()}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface shadow-lg shadow-brand/20 transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply crop & download
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setCrop(DEFAULT_CROP_RECT)}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              Reset frame
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              Choose another file
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
        label={showWorkspace ? "Apply crop" : "Crop PDF"}
        secondaryHref="/"
        secondaryLabel="Home"
      />
    </div>
  );
}
