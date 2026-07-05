"use client";

import { clsx } from "clsx";
import { GripVertical, Loader2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { analyzeFaviconCompressionSavings, formatBytes } from "@/lib/favicon-compressor";

export type FaviconCompressorBeforeAfterLabels = {
  title: string;
  hint: string;
  beforeLabel: string;
  afterLabel: string;
  sliderAria: string;
  waitingForCompression: string;
  calculating: string;
  weightSavingsTitle: string;
  weightSavingsHint: string;
  originalWeight: string;
  optimizedWeight: string;
  bytesSaved: (saved: string, bytes: number) => string;
  noSavingsYet: string;
  alreadyOptimal: string;
};

type FaviconCompressorBeforeAfterCompareProps = {
  beforeSrc: string;
  afterSrc: string | null;
  originalBytes: number;
  compressedBytes: number | null;
  estimating: boolean;
  ready: boolean;
  labels: FaviconCompressorBeforeAfterLabels;
  onBeforeImageLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
};

export function FaviconCompressorBeforeAfterCompare({
  beforeSrc,
  afterSrc,
  originalBytes,
  compressedBytes,
  estimating,
  ready,
  labels,
  onBeforeImageLoad,
}: FaviconCompressorBeforeAfterCompareProps) {
  const sliderInputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [position, setPosition] = useState(50);

  const updatePositionFromClientX = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return;

    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, next)));
  }, []);

  useEffect(() => {
    const stopDragging = () => {
      draggingRef.current = false;
    };

    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!ready || !afterSrc) return;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePositionFromClientX(event.clientX);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updatePositionFromClientX(event.clientX);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const savings =
    compressedBytes !== null
      ? analyzeFaviconCompressionSavings(originalBytes, compressedBytes)
      : null;

  const showSlider = ready && Boolean(afterSrc);

  return (
    <section
      className="favicon-compressor-tool__compare tool-workspace-panel"
      aria-labelledby="favicon-compressor-compare-heading"
    >
      <h3 id="favicon-compressor-compare-heading" className="favicon-compressor-tool__compare-title">
        {labels.title}
      </h3>
      <p className="favicon-compressor-tool__compare-hint">{labels.hint}</p>

      <div className="favicon-compressor-tool__compare-row">
        <div className="favicon-compressor-tool__compare-visual">
          <div
            ref={containerRef}
            className={clsx(
              "favicon-compressor-tool__compare-stage",
              showSlider && "favicon-compressor-tool__compare-stage--interactive",
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <img
              src={beforeSrc}
              alt=""
              className="favicon-compressor-tool__compare-img favicon-compressor-tool__compare-img--before"
              draggable={false}
              onLoad={onBeforeImageLoad}
            />

            {showSlider && afterSrc ? (
              <>
                <img
                  src={afterSrc}
                  alt=""
                  className="favicon-compressor-tool__compare-img favicon-compressor-tool__compare-img--after"
                  style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
                  draggable={false}
                />
                <div
                  className="favicon-compressor-tool__compare-divider"
                  style={{ left: `${position}%` }}
                  aria-hidden
                >
                  <span className="favicon-compressor-tool__compare-handle">
                    <GripVertical strokeWidth={2} aria-hidden />
                  </span>
                </div>
                <label htmlFor={sliderInputId} className="sr-only">
                  {labels.sliderAria}
                </label>
                <input
                  id={sliderInputId}
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(position)}
                  onChange={(event) => setPosition(Number(event.target.value))}
                  className="favicon-compressor-tool__compare-range"
                  aria-valuetext={`${Math.round(position)}%`}
                />
              </>
            ) : estimating ? (
              <div className="favicon-compressor-tool__compare-overlay" role="status" aria-live="polite">
                <Loader2 className="favicon-compressor-tool__compare-overlay-icon" strokeWidth={2} aria-hidden />
                <span>{labels.calculating}</span>
              </div>
            ) : (
              <div className="favicon-compressor-tool__compare-overlay" role="status" aria-live="polite">
                <span>{labels.waitingForCompression}</span>
              </div>
            )}

            <span className="favicon-compressor-tool__compare-badge favicon-compressor-tool__compare-badge--before">
              {labels.beforeLabel}
            </span>
            <span className="favicon-compressor-tool__compare-badge favicon-compressor-tool__compare-badge--after">
              {labels.afterLabel}
            </span>
          </div>
        </div>

        <aside className="favicon-compressor-tool__weight-savings" aria-labelledby="favicon-compressor-weight-heading">
          <h4 id="favicon-compressor-weight-heading" className="favicon-compressor-tool__weight-title">
            {labels.weightSavingsTitle}
          </h4>
          <p className="favicon-compressor-tool__weight-hint">{labels.weightSavingsHint}</p>

          <div className="favicon-compressor-tool__weight-grid">
            <div className="favicon-compressor-tool__weight-card">
              <span className="favicon-compressor-tool__weight-label">{labels.originalWeight}</span>
              <span className="favicon-compressor-tool__weight-value">{formatBytes(originalBytes)}</span>
            </div>
            <div className="favicon-compressor-tool__weight-card favicon-compressor-tool__weight-card--optimized">
              <span className="favicon-compressor-tool__weight-label">{labels.optimizedWeight}</span>
              <span className="favicon-compressor-tool__weight-value">
                {estimating
                  ? labels.calculating
                  : compressedBytes !== null
                    ? formatBytes(compressedBytes)
                    : "—"}
              </span>
            </div>
          </div>

          {estimating ? (
            <p className="favicon-compressor-tool__weight-status" role="status" aria-live="polite">
              {labels.calculating}
            </p>
          ) : savings?.hasSavings ? (
            <p className="favicon-compressor-tool__weight-saved" role="status" aria-live="polite">
              {labels.bytesSaved(formatBytes(savings.savedBytes), savings.savedBytes)}
            </p>
          ) : savings?.alreadyOptimal ? (
            <p className="favicon-compressor-tool__weight-status favicon-compressor-tool__weight-status--neutral">
              {labels.alreadyOptimal}
            </p>
          ) : (
            <p className="favicon-compressor-tool__weight-status">{labels.noSavingsYet}</p>
          )}
        </aside>
      </div>
    </section>
  );
}
