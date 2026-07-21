"use client";

import { clsx } from "clsx";
import { Maximize2, Minus, Plus, RotateCcw, X, ZoomIn } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";

export type PreviewInspectOverlayProps = {
  open: boolean;
  /** Image / canvas data URL or remote src for the lightbox. */
  src: string | null;
  title?: string;
  emptyLabel?: string;
  closeLabel?: string;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  resetLabel?: string;
  fitLabel?: string;
  onClose: () => void;
};

/** Fit-to-screen baseline; deep zoom goes well past 5× for fine detail. */
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.5;
/** Quick deep-zoom presets shown in the toolbar. */
const ZOOM_PRESETS = [1, 2, 3, 5] as const;
/** Open slightly zoomed so the inspect view feels immediately useful. */
const INITIAL_ZOOM = 1;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}

/**
 * Interactive deep-zoom lightbox for the active document/image preview.
 * Multi-level zoom (0.5×–8×) with + / − / Fit / Reset, wheel + double-click,
 * and pan when magnified.
 */
export function PreviewInspectOverlay({
  open,
  src,
  title = "Preview",
  emptyLabel = "No preview available yet. Upload a file first.",
  closeLabel = "Close preview",
  zoomInLabel = "Zoom in",
  zoomOutLabel = "Zoom out",
  resetLabel = "Reset zoom",
  fitLabel = "Fit to screen",
  onClose,
}: PreviewInspectOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  const offsetRef = useRef(offset);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fitToScreen = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!open) return;
    fitToScreen();
  }, [open, src, fitToScreen]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /** Zoom while keeping the given stage-local point stable (wheel / double-click). */
  const zoomAtPoint = useCallback((nextZoom: number, clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) {
      setZoom(clampZoom(nextZoom));
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
    setOffset({
      x: cx - (cx - x) * ratio,
      y: cy - (cy - y) * ratio,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
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
        setZoom((value) => clampZoom(value - ZOOM_STEP));
        return;
      }
      if (event.key === "0" || event.key === "f" || event.key === "F") {
        event.preventDefault();
        fitToScreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, fitToScreen]);

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
      if (!src || event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: offset.x,
        originY: offset.y,
        moved: false,
      };
    },
    [offset.x, offset.y, src],
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    setOffset({
      x: drag.originX + dx,
      y: drag.originY + dy,
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

  const onDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!src) return;
      event.preventDefault();
      const current = zoomRef.current;
      // Cycle deep-zoom levels toward the click point: fit → 2× → 3× → 5× → fit.
      const next =
        current < 1.5 ? 2 : current < 2.5 ? 3 : current < 4 ? 5 : 1;
      if (next === 1) {
        fitToScreen();
        return;
      }
      zoomAtPoint(next, event.clientX, event.clientY);
    },
    [fitToScreen, src, zoomAtPoint],
  );

  if (!mounted || !open) return null;

  const canZoomIn = Boolean(src) && zoom < MAX_ZOOM;
  const canZoomOut = Boolean(src) && zoom > MIN_ZOOM;

  return createPortal(
    <div
      className="preview-inspect"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="preview-inspect__chrome">
        <p className="preview-inspect__title">{title}</p>

        <div className="preview-inspect__toolbar" role="toolbar" aria-label={title}>
          <div className="preview-inspect__zoom-group">
            <button
              type="button"
              className="preview-inspect__btn preview-inspect__btn--labeled"
              onClick={() => setZoom((value) => clampZoom(value - ZOOM_STEP))}
              aria-label={zoomOutLabel}
              title={`${zoomOutLabel} (−)`}
              disabled={!canZoomOut}
            >
              <Minus size={18} strokeWidth={2.25} aria-hidden />
              <span className="preview-inspect__btn-text">−</span>
            </button>

            <span className="preview-inspect__zoom-label" aria-live="polite">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              className="preview-inspect__btn preview-inspect__btn--labeled"
              onClick={() => setZoom((value) => clampZoom(value + ZOOM_STEP))}
              aria-label={zoomInLabel}
              title={`${zoomInLabel} (+)`}
              disabled={!canZoomIn}
            >
              <Plus size={18} strokeWidth={2.25} aria-hidden />
              <span className="preview-inspect__btn-text">+</span>
            </button>
          </div>

          <div className="preview-inspect__presets" role="group" aria-label={fitLabel}>
            {ZOOM_PRESETS.map((level) => (
              <button
                key={level}
                type="button"
                className={clsx(
                  "preview-inspect__preset",
                  Math.abs(zoom - level) < 0.05 && "preview-inspect__preset--active",
                )}
                onClick={() => {
                  if (level === 1) {
                    fitToScreen();
                    return;
                  }
                  setZoom(level);
                }}
                disabled={!src}
                aria-pressed={Math.abs(zoom - level) < 0.05}
                title={`${level}×`}
              >
                {level}×
              </button>
            ))}
          </div>

          <button
            type="button"
            className="preview-inspect__btn preview-inspect__btn--labeled"
            onClick={fitToScreen}
            aria-label={fitLabel}
            title={`${fitLabel} (F)`}
            disabled={!src}
          >
            <Maximize2 size={17} strokeWidth={2} aria-hidden />
            <span className="preview-inspect__btn-text">{fitLabel}</span>
          </button>

          <button
            type="button"
            className="preview-inspect__btn"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            aria-label={resetLabel}
            title={resetLabel}
            disabled={!src}
          >
            <RotateCcw size={18} strokeWidth={2} aria-hidden />
          </button>

          <button
            type="button"
            className="preview-inspect__btn preview-inspect__btn--close"
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
            autoFocus
          >
            <X size={18} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className={clsx(
          "preview-inspect__stage",
          src && "preview-inspect__stage--active",
          src && zoom > 1.01 && "preview-inspect__stage--pannable",
        )}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        onClick={(event) => {
          // Click empty stage chrome (not the image) closes — only when not dragging.
          if (event.target === event.currentTarget && !dragRef.current?.moved) {
            onClose();
          }
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="preview-inspect__image"
            draggable={false}
            decoding="async"
            style={{
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
            }}
          />
        ) : (
          <div className="preview-inspect__empty">
            <ZoomIn size={28} strokeWidth={1.75} aria-hidden />
            <p>{emptyLabel}</p>
          </div>
        )}
      </div>

      {src ? (
        <p className="preview-inspect__hint">
          Scroll to zoom · Drag to pan · Double-click for 2× / 3× / 5×
        </p>
      ) : null}
    </div>,
    document.body,
  );
}
