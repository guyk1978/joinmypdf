"use client";

import { renderPdfPageThumbnail } from "@/lib/pdf-delete-pages";
import { clsx } from "clsx";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";

/** Higher than grid thumbs so the lightbox stays sharp when zoomed. */
export const PDF_PAGE_PREVIEW_SCALE = 2.25;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}

export type PdfPagePreviewModalProps = {
  open: boolean;
  fileBytes: Uint8Array | null;
  /** 0-based page index in the source PDF. */
  pageIndex: number;
  password?: string;
  /** Header label, e.g. "Page 3 of 18". */
  title: string;
  closeLabel?: string;
  loadingLabel?: string;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  onClose: () => void;
};

/**
 * Industrial Matte lightbox for a single PDF page — header zoom slider + pan,
 * Escape / backdrop / X to dismiss. Used by delete / reorder / extract grids.
 */
export function PdfPagePreviewModal({
  open,
  fileBytes,
  pageIndex,
  password = "",
  title,
  closeLabel = "Close preview",
  loadingLabel = "Loading preview…",
  zoomInLabel = "Zoom in",
  zoomOutLabel = "Zoom out",
  onClose,
}: PdfPagePreviewModalProps) {
  const titleId = useId();
  const zoomId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const resetView = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!open) return;
    resetView();
  }, [open, pageIndex, fileBytes, resetView]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoom((value) => clampZoom(value + ZOOM_STEP));
        return;
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        setZoom((value) => {
          const next = clampZoom(value - ZOOM_STEP);
          if (next <= 1) setOffset({ x: 0, y: 0 });
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !fileBytes) {
      setLoading(false);
      setReady(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    setReady(false);
    void renderPdfPageThumbnail(fileBytes, pageIndex, password, PDF_PAGE_PREVIEW_SCALE)
      .then((canvas) => {
        if (cancelled || !canvasRef.current) return;
        const node = canvasRef.current;
        node.width = canvas.width;
        node.height = canvas.height;
        const ctx = node.getContext("2d");
        if (ctx) ctx.drawImage(canvas, 0, 0);
        setLoading(false);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
        setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, fileBytes, pageIndex, password]);

  const setZoomClamped = useCallback((next: number) => {
    const value = clampZoom(next);
    setZoom(value);
    if (value <= 1) setOffset({ x: 0, y: 0 });
  }, []);

  const zoomAtPoint = useCallback((nextZoom: number, clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) {
      setZoomClamped(nextZoom);
      return;
    }
    const rect = stage.getBoundingClientRect();
    const cx = clientX - rect.left - rect.width / 2;
    const cy = clientY - rect.top - rect.height / 2;
    const prev = zoomRef.current;
    const next = clampZoom(nextZoom);
    if (next === prev) return;
    const ratio = next / prev;
    const { x, y } = offsetRef.current;
    setZoom(next);
    if (next <= 1) {
      setOffset({ x: 0, y: 0 });
      return;
    }
    setOffset({
      x: cx - (cx - x) * ratio,
      y: cy - (cy - y) * ratio,
    });
  }, [setZoomClamped]);

  const onWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (!ready) return;
      event.preventDefault();
      const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      zoomAtPoint(zoomRef.current + delta, event.clientX, event.clientY);
    },
    [ready, zoomAtPoint],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!ready || event.button !== 0 || zoomRef.current <= 1.01) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: offset.x,
        originY: offset.y,
      };
    },
    [offset.x, offset.y, ready],
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset({
      x: drag.originX + (event.clientX - drag.startX),
      y: drag.originY + (event.clientY - drag.startY),
    });
  }, []);

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Already released.
    }
  }, []);

  const onBackdropClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  if (!mounted || !open) return null;

  const canZoomIn = ready && zoom < MAX_ZOOM;
  const canZoomOut = ready && zoom > MIN_ZOOM;
  const pannable = ready && zoom > 1.01;

  return createPortal(
    <div
      className="pdf-page-preview"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={onBackdropClick}
    >
      <div
        className={clsx("pdf-page-preview__card", loading && "is-loading")}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="pdf-page-preview__header">
          <h2 id={titleId} className="pdf-page-preview__title">
            {title}
          </h2>

          <div className="pdf-page-preview__zoom" role="group" aria-label="Zoom">
            <button
              type="button"
              className="pdf-page-preview__zoom-btn"
              aria-label={zoomOutLabel}
              title={zoomOutLabel}
              disabled={!canZoomOut}
              onClick={() => setZoomClamped(zoom - ZOOM_STEP)}
            >
              <ZoomOut className="pdf-page-preview__zoom-icon pdf-page-preview__zoom-icon--out" aria-hidden />
            </button>

            <label className="pdf-page-preview__slider-wrap" htmlFor={zoomId}>
              <span className="sr-only">
                {Math.round(zoom * 100)}%
              </span>
              <input
                id={zoomId}
                type="range"
                className="pdf-page-preview__slider"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.05}
                value={zoom}
                disabled={!ready}
                style={{
                  ["--pdf-preview-zoom-pct" as string]: `${
                    ((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100
                  }%`,
                }}
                aria-valuemin={MIN_ZOOM}
                aria-valuemax={MAX_ZOOM}
                aria-valuenow={zoom}
                aria-valuetext={`${Math.round(zoom * 100)}%`}
                onChange={(event) => setZoomClamped(Number(event.target.value))}
              />
            </label>

            <button
              type="button"
              className="pdf-page-preview__zoom-btn"
              aria-label={zoomInLabel}
              title={zoomInLabel}
              disabled={!canZoomIn}
              onClick={() => setZoomClamped(zoom + ZOOM_STEP)}
            >
              <ZoomIn className="pdf-page-preview__zoom-icon pdf-page-preview__zoom-icon--in" aria-hidden />
            </button>
          </div>

          <button
            ref={closeRef}
            type="button"
            className="pdf-page-preview__close"
            aria-label={closeLabel}
            title={closeLabel}
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div
          ref={stageRef}
          className={clsx(
            "pdf-page-preview__stage",
            pannable && "pdf-page-preview__stage--pannable",
          )}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {loading ? (
            <p className="pdf-page-preview__status" aria-live="polite">
              {loadingLabel}
            </p>
          ) : null}
          {error ? (
            <p className="pdf-page-preview__status" role="alert">
              {loadingLabel}
            </p>
          ) : null}
          <div
            className={clsx(
              "pdf-page-preview__viewport",
              (loading || error) && "is-hidden",
            )}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            }}
          >
            <canvas ref={canvasRef} className="pdf-page-preview__canvas" />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
