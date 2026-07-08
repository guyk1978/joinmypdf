"use client";

import { clsx } from "clsx";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { Download, Lock, RotateCcw, Shield } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { imBtnCta } from "@/lib/design-system";
import {
  FaviconCropperPreviewPanel,
  type FaviconCropperPreviewPanelLabels,
} from "@/components/FaviconCropperPreviewPanel";
import {
  clampSquareCropRect,
  cropRectFocalPoint,
  defaultSquareCropForImage,
  detectFaviconCropFormat,
  focalPointSquareCrop,
  FAVICON_CROP_OUTPUT_OPTIONS,
  faviconCropOutputName,
  getCroppedFaviconBlob,
  isAcceptedFaviconCropFile,
  loadFaviconCropPreview,
  resizeSquareCropRect,
  squareCropToPixels,
  type FaviconCropOutputSize,
} from "@/lib/favicon-cropper";
import {
  downloadBlob,
  getImageDisplayLayout,
  type ImageDisplayLayout,
} from "@/lib/crop-image";
import type { NormalizedCropRect } from "@/lib/crop-pdf";

export type FaviconCropperLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  cropInstructions: string;
  outputSizeLabel: string;
  formatOutputSize: (key: string) => string;
  downloadCropped: string;
  cropping: string;
  invalidFile: string;
  replaceImage: string;
  previewPanel: FaviconCropperPreviewPanelLabels;
  privacyBadgeWaiting: string;
  privacyBadgeLocal: string;
  focalPointLabel: string;
  focalPointHint: string;
  focalPointCenter: string;
  formatDetectedLabel: string;
  formatLoadingHint: string;
  formatLabel: (format: string) => string;
  quickReset: string;
  quickResetHint: string;
};

export type FaviconCropperProps = {
  labels: FaviconCropperLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

type HandleId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "move";

type DragMode = {
  handle: HandleId;
  startRect: NormalizedCropRect;
  startX: number;
  startY: number;
};

const ACCEPT = "image/png,image/jpeg,image/svg+xml,.png,.jpg,.jpeg,.svg";

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

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;

function hitHandle(
  rect: NormalizedCropRect,
  px: number,
  py: number,
  width: number,
  height: number,
): HandleId | null {
  const x = px / width;
  const y = py / height;
  const edge = 0.05;
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

function handleStyle(handle: (typeof HANDLES)[number], crop: NormalizedCropRect): CSSProperties {
  const style: CSSProperties = { cursor: HANDLE_CURSORS[handle] };

  if (handle === "nw") {
    style.left = `${crop.nx * 100}%`;
    style.top = `${crop.ny * 100}%`;
  }
  if (handle === "n") {
    style.left = `calc(${crop.nx * 100}% + ${(crop.nw * 100) / 2}% - 5px)`;
    style.top = `${crop.ny * 100}%`;
  }
  if (handle === "ne") {
    style.left = `calc(${(crop.nx + crop.nw) * 100}% - 10px)`;
    style.top = `${crop.ny * 100}%`;
  }
  if (handle === "e") {
    style.left = `calc(${(crop.nx + crop.nw) * 100}% - 10px)`;
    style.top = `calc(${crop.ny * 100}% + ${(crop.nh * 100) / 2}% - 5px)`;
  }
  if (handle === "se") {
    style.left = `calc(${(crop.nx + crop.nw) * 100}% - 10px)`;
    style.top = `calc(${(crop.ny + crop.nh) * 100}% - 10px)`;
  }
  if (handle === "s") {
    style.left = `calc(${crop.nx * 100}% + ${(crop.nw * 100) / 2}% - 5px)`;
    style.top = `calc(${(crop.ny + crop.nh) * 100}% - 10px)`;
  }
  if (handle === "sw") {
    style.left = `${crop.nx * 100}%`;
    style.top = `calc(${(crop.ny + crop.nh) * 100}% - 10px)`;
  }
  if (handle === "w") {
    style.left = `${crop.nx * 100}%`;
    style.top = `calc(${crop.ny * 100}% + ${(crop.nh * 100) / 2}% - 5px)`;
  }

  return style;
}

export function FaviconCropper({ labels, className, onDownload }: FaviconCropperProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragMode | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [layout, setLayout] = useState<ImageDisplayLayout | null>(null);
  const [crop, setCrop] = useState<NormalizedCropRect>({ nx: 0.1, ny: 0.1, nw: 0.8, nh: 0.8 });
  const [outputSize, setOutputSize] = useState<FaviconCropOutputSize>("native");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [focalPointMode, setFocalPointMode] = useState(false);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => revokeObjectUrl(), [revokeObjectUrl]);

  const updateLayout = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !naturalSize) return;
    setLayout(
      getImageDisplayLayout(
        stage.clientWidth,
        stage.clientHeight,
        naturalSize.width,
        naturalSize.height,
      ),
    );
  }, [naturalSize]);

  useEffect(() => {
    if (!naturalSize) return;
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [naturalSize, updateLayout]);

  const reset = useCallback(() => {
    revokeObjectUrl();
    setSourceFile(null);
    setImageSrc(null);
    setNaturalSize(null);
    setLayout(null);
    setCrop({ nx: 0.1, ny: 0.1, nw: 0.8, nh: 0.8 });
    setOutputSize("native");
    setFocalPointMode(false);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [revokeObjectUrl]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedFaviconCropFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      setError("");
      revokeObjectUrl();

      try {
        const url = await loadFaviconCropPreview(file);
        objectUrlRef.current = url;
        setSourceFile(file);
        setImageSrc(url);
        setNaturalSize(null);
        setLayout(null);
        setOutputSize("native");
        setFocalPointMode(false);
      } catch {
        setError(labels.invalidFile);
      }
    },
    [labels.invalidFile, revokeObjectUrl],
  );

  const pointerPos = (event: ReactPointerEvent) => {
    const overlay = overlayRef.current;
    if (!overlay) return { x: 0, y: 0 };
    const rect = overlay.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const applyFocalPoint = useCallback(
    (focalNx: number, focalNy: number) => {
      if (!naturalSize) return;
      setCrop(
        focalPointSquareCrop(
          naturalSize.width,
          naturalSize.height,
          focalNx,
          focalNy,
        ),
      );
    },
    [naturalSize],
  );

  const quickResetCrop = useCallback(() => {
    if (!naturalSize) return;
    setFocalPointMode(false);
    setCrop(defaultSquareCropForImage(naturalSize.width, naturalSize.height));
  }, [naturalSize]);

  const onPointerDown = (event: ReactPointerEvent) => {
    const overlay = overlayRef.current;
    if (!overlay || !layout) return;

    const { x, y } = pointerPos(event);
    const handle = hitHandle(crop, x, y, layout.displayWidth, layout.displayHeight);

    if (focalPointMode && !handle) {
      const focalNx = x / layout.displayWidth;
      const focalNy = y / layout.displayHeight;
      applyFocalPoint(focalNx, focalNy);
      return;
    }

    if (!handle) return;

    event.preventDefault();
    overlay.setPointerCapture(event.pointerId);
    dragRef.current = {
      handle,
      startRect: clampSquareCropRect(crop),
      startX: x,
      startY: y,
    };
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    const mode = dragRef.current;
    const overlay = overlayRef.current;
    if (!mode || !overlay || !layout) return;

    const { x, y } = pointerPos(event);
    const dx = (x - mode.startX) / layout.displayWidth;
    const dy = (y - mode.startY) / layout.displayHeight;
    setCrop(resizeSquareCropRect(mode.startRect, mode.handle, dx, dy));
  };

  const onPointerUp = (event: ReactPointerEvent) => {
    if (overlayRef.current?.hasPointerCapture(event.pointerId)) {
      overlayRef.current.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  };

  const handleDownload = async () => {
    if (!imageSrc || !sourceFile || !naturalSize || busy) return;

    setBusy(true);
    setError("");

    try {
      const pixelCrop = squareCropToPixels(crop, naturalSize.width, naturalSize.height);
      const blob = await getCroppedFaviconBlob(imageSrc, pixelCrop, outputSize);
      const filename = faviconCropOutputName(sourceFile.name, outputSize);
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
    } catch {
      setError(labels.invalidFile);
    } finally {
      setBusy(false);
    }
  };

  const frameStyle: CSSProperties = {
    left: `${crop.nx * 100}%`,
    top: `${crop.ny * 100}%`,
    width: `${crop.nw * 100}%`,
    height: `${crop.nh * 100}%`,
  };

  const privacyBadge = (
    <p
      className={clsx(
        "favicon-cropper-tool__privacy-badge",
        imageSrc
          ? "favicon-cropper-tool__privacy-badge--local"
          : "favicon-cropper-tool__privacy-badge--waiting",
      )}
      role="status"
      aria-live="polite"
    >
      {imageSrc ? (
        <>
          <Lock className="favicon-cropper-tool__privacy-badge-icon" strokeWidth={2} aria-hidden />
          <span>{labels.privacyBadgeLocal}</span>
        </>
      ) : (
        <>
          <Shield className="favicon-cropper-tool__privacy-badge-icon" strokeWidth={2} aria-hidden />
          <span>{labels.privacyBadgeWaiting}</span>
        </>
      )}
    </p>
  );

  return (
    <div className={clsx("crop-image-tool favicon-cropper-tool", className)}>
      {!imageSrc ? (
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectFile}
          selectAria={labels.selectFileAria}
          dropHint={labels.dropHint}
          supportedFormats={["PNG", "JPG", "SVG"]}
          accept={ACCEPT}
          onFiles={(files) => {
            const file = Array.from(files)[0];
            if (file) void loadFile(file);
          }}
        />
      ) : (
        <div className="crop-image-tool__workspace">
          {privacyBadge}

          {sourceFile ? (
            <p className="favicon-cropper-tool__format-badge" role="status" aria-live="polite">
              <span className="favicon-cropper-tool__format-label">{labels.formatDetectedLabel}</span>
              <span className="favicon-cropper-tool__format-value">
                {labels.formatLabel(detectFaviconCropFormat(sourceFile))}
              </span>
            </p>
          ) : null}

          {!naturalSize ? (
            <p className="favicon-cropper-tool__format-loading" role="status">
              {labels.formatLoadingHint}
            </p>
          ) : (
            <p className="crop-image-tool__instructions">{labels.cropInstructions}</p>
          )}

          <div ref={stageRef} className="crop-image-tool__stage favicon-cropper-tool__stage">
            <img
              src={imageSrc}
              alt=""
              className="crop-image-tool__img"
              draggable={false}
              onLoad={(event) => {
                const img = event.currentTarget;
                const width = img.naturalWidth;
                const height = img.naturalHeight;
                setNaturalSize({ width, height });
                setCrop(defaultSquareCropForImage(width, height));
              }}
            />

            {layout ? (
              <div
                ref={overlayRef}
                className={clsx(
                  "crop-image-tool__overlay",
                  focalPointMode && "favicon-cropper-tool__overlay--focal",
                )}
                style={{
                  left: layout.offsetX,
                  top: layout.offsetY,
                  width: layout.displayWidth,
                  height: layout.displayHeight,
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              >
                <div
                  className={clsx(
                    "crop-image-tool__frame favicon-cropper-tool__frame",
                    focalPointMode && "favicon-cropper-tool__frame--focal",
                  )}
                  style={frameStyle}
                >
                  <div className="crop-image-tool__grid favicon-cropper-tool__grid" aria-hidden />
                  {focalPointMode ? (
                    <>
                      <div className="favicon-cropper-tool__focal-thirds" aria-hidden />
                      <div className="favicon-cropper-tool__focal-crosshair" aria-hidden />
                    </>
                  ) : null}
                </div>

                {HANDLES.map((handle) => (
                  <span
                    key={handle}
                    className="crop-image-tool__handle favicon-cropper-tool__handle"
                    style={handleStyle(handle, crop)}
                    aria-hidden
                  />
                ))}
              </div>
            ) : null}
          </div>

          {naturalSize ? (
            <FaviconCropperPreviewPanel
              imageSrc={imageSrc}
              crop={crop}
              naturalWidth={naturalSize.width}
              naturalHeight={naturalSize.height}
              labels={labels.previewPanel}
            />
          ) : null}

          <div className="favicon-cropper-tool__controls tool-workspace-panel">
            <div className="favicon-cropper-tool__quick-reset-field">
              <button
                type="button"
                className="favicon-cropper-tool__quick-reset-btn"
                onClick={quickResetCrop}
                disabled={busy || !naturalSize}
              >
                <RotateCcw className="favicon-cropper-tool__quick-reset-icon" strokeWidth={2} aria-hidden />
                {labels.quickReset}
              </button>
              <p className="favicon-cropper-tool__quick-reset-hint">{labels.quickResetHint}</p>
            </div>

            <div className="favicon-cropper-tool__focal-field">
              <label className="favicon-cropper-tool__focal-toggle">
                <input
                  type="checkbox"
                  checked={focalPointMode}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setFocalPointMode(enabled);
                    if (enabled && naturalSize) {
                      const { fx, fy } = cropRectFocalPoint(crop);
                      applyFocalPoint(fx, fy);
                    }
                  }}
                  disabled={busy || !naturalSize}
                />
                <span className="favicon-cropper-tool__focal-toggle-title">{labels.focalPointLabel}</span>
              </label>
              <p className="favicon-cropper-tool__focal-hint">{labels.focalPointHint}</p>
              {focalPointMode ? (
                <button
                  type="button"
                  className="favicon-cropper-tool__focal-center-btn"
                  onClick={() => {
                    if (naturalSize) applyFocalPoint(0.5, 0.5);
                  }}
                  disabled={busy || !naturalSize}
                >
                  {labels.focalPointCenter}
                </button>
              ) : null}
            </div>

            <span className="favicon-cropper-tool__section-label" id="favicon-crop-size-label">
              {labels.outputSizeLabel}
            </span>
            <div
              className="favicon-cropper-tool__size-row"
              role="radiogroup"
              aria-labelledby="favicon-crop-size-label"
            >
              {FAVICON_CROP_OUTPUT_OPTIONS.map((option) => (
                <label key={String(option.value)} className="favicon-cropper-tool__size-option">
                  <input
                    type="radio"
                    name="favicon-crop-output-size"
                    checked={outputSize === option.value}
                    onChange={() => setOutputSize(option.value)}
                    disabled={busy}
                  />
                  <span>{labels.formatOutputSize(option.labelKey)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="crop-image-tool__actions">
            <button
              type="button"
              className="crop-image-tool__secondary-btn"
              onClick={reset}
              disabled={busy}
            >
              {labels.replaceImage}
            </button>
            <button
              type="button"
              className={clsx(imBtnCta, "crop-image-tool__primary-btn")}
              onClick={() => void handleDownload()}
              disabled={busy || !naturalSize}
            >
              <Download className="h-4 w-4" aria-hidden />
              {busy ? labels.cropping : labels.downloadCropped}
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p className="crop-image-tool__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
