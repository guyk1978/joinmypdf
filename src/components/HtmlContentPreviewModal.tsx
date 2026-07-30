"use client";

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

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}

export type HtmlContentPreviewModalProps = {
  open: boolean;
  /** Sanitized/trusted HTML fragment for the live preview. */
  html: string;
  /** Surface + typography classes matching the inline preview theme. */
  contentClassName?: string;
  title: string;
  closeLabel?: string;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  onClose: () => void;
};

/**
 * Industrial Matte lightbox for rendered HTML previews — same header zoom
 * slider + pan interaction as PdfPagePreviewModal / ExtractedImagePreviewModal.
 */
export function HtmlContentPreviewModal({
  open,
  html,
  contentClassName,
  title,
  closeLabel = "Close preview",
  zoomInLabel = "Zoom in",
  zoomOutLabel = "Zoom out",
  onClose,
}: HtmlContentPreviewModalProps) {
  const titleId = useId();
  const zoomId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
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
  }, [open, html, resetView]);

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

  const setZoomClamped = useCallback((next: number) => {
    const value = clampZoom(next);
    setZoom(value);
    if (value <= 1) setOffset({ x: 0, y: 0 });
  }, []);

  const zoomAtPoint = useCallback(
    (nextZoom: number, clientX: number, clientY: number) => {
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
    },
    [setZoomClamped],
  );

  const onWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      zoomAtPoint(zoomRef.current + delta, event.clientX, event.clientY);
    },
    [zoomAtPoint],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || zoomRef.current <= 1.01) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: offset.x,
        originY: offset.y,
      };
    },
    [offset.x, offset.y],
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

  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;
  const pannable = zoom > 1.01;
  const ready = Boolean(html);

  return createPortal(
    <div
      className="pdf-page-preview"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-html-content-preview=""
      onMouseDown={onBackdropClick}
    >
      <div
        className="pdf-page-preview__card"
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
              <span className="sr-only">{Math.round(zoom * 100)}%</span>
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
          <div
            className="pdf-page-preview__viewport"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            }}
          >
            <div
              className={clsx("pdf-page-preview__html-sheet", contentClassName)}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
