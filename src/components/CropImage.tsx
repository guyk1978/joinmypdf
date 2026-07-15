"use client";

import { clsx } from "clsx";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { Magnifier } from "@/components/Magnifier";

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
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import {
  clampCropRect,
  DEFAULT_CROP_RECT,
  type NormalizedCropRect,
} from "@/lib/crop-pdf";
import {
  cropImageOutputName,
  downloadBlob,
  getCroppedImageBlob,
  getImageDisplayLayout,
  isAcceptedImageFile,
  loadImageFileForCrop,
  type ImageDisplayLayout,
} from "@/lib/crop-image";

export type CropImageLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  cropAndDownload: string;
  cropping: string;
  cropInstructions: string;
  invalidFile: string;
  replaceImage: string;
};

export type CropImageProps = {
  labels: CropImageLabels;
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

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif";

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

function normalizedCropToPixels(
  rect: NormalizedCropRect,
  naturalWidth: number,
  naturalHeight: number,
) {
  const safe = clampCropRect(rect);
  return {
    x: safe.nx * naturalWidth,
    y: safe.ny * naturalHeight,
    width: safe.nw * naturalWidth,
    height: safe.nh * naturalHeight,
  };
}

function handleStyle(handle: (typeof HANDLES)[number], crop: NormalizedCropRect): CSSProperties {
  const style: CSSProperties = { cursor: HANDLE_CURSORS[handle] };

  if (handle === "nw") {
    style.left = `${crop.nx * 100}%`;
    style.top = `${crop.ny * 100}%`;
  }
  if (handle === "n") {
    style.left = `calc(${crop.nx * 100}% + ${(crop.nw * 100) / 2}% - 7px)`;
    style.top = `${crop.ny * 100}%`;
  }
  if (handle === "ne") {
    style.left = `calc(${(crop.nx + crop.nw) * 100}% - 14px)`;
    style.top = `${crop.ny * 100}%`;
  }
  if (handle === "e") {
    style.left = `calc(${(crop.nx + crop.nw) * 100}% - 14px)`;
    style.top = `calc(${crop.ny * 100}% + ${(crop.nh * 100) / 2}% - 7px)`;
  }
  if (handle === "se") {
    style.left = `calc(${(crop.nx + crop.nw) * 100}% - 14px)`;
    style.top = `calc(${(crop.ny + crop.nh) * 100}% - 14px)`;
  }
  if (handle === "s") {
    style.left = `calc(${crop.nx * 100}% + ${(crop.nw * 100) / 2}% - 7px)`;
    style.top = `calc(${(crop.ny + crop.nh) * 100}% - 14px)`;
  }
  if (handle === "sw") {
    style.left = `${crop.nx * 100}%`;
    style.top = `calc(${(crop.ny + crop.nh) * 100}% - 14px)`;
  }
  if (handle === "w") {
    style.left = `${crop.nx * 100}%`;
    style.top = `calc(${crop.ny * 100}% + ${(crop.nh * 100) / 2}% - 7px)`;
  }

  return style;
}

export function CropImage({ labels, className, onDownload }: CropImageProps) {
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragMode | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [layout, setLayout] = useState<ImageDisplayLayout | null>(null);
  const [crop, setCrop] = useState<NormalizedCropRect>(DEFAULT_CROP_RECT);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => revokeObjectUrl, [revokeObjectUrl]);

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
    setCrop(DEFAULT_CROP_RECT);
    setError("");
    setShowFeedback(false);
    registerFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [registerFile, revokeObjectUrl]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedImageFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      setError("");
      revokeObjectUrl();

      try {
        const url = await loadImageFileForCrop(file);
        objectUrlRef.current = url;
        setSourceFile(file);
        setImageSrc(url);
        setCrop(DEFAULT_CROP_RECT);
        setNaturalSize(null);
        setLayout(null);
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

  const onPointerDown = (event: ReactPointerEvent) => {
    const overlay = overlayRef.current;
    if (!overlay || !layout) return;

    const { x, y } = pointerPos(event);
    const handle = hitHandle(crop, x, y, layout.displayWidth, layout.displayHeight);
    if (!handle) return;

    event.preventDefault();
    overlay.setPointerCapture(event.pointerId);
    dragRef.current = { handle, startRect: crop, startX: x, startY: y };
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    const mode = dragRef.current;
    const overlay = overlayRef.current;
    if (!mode || !overlay || !layout) return;

    const { x, y } = pointerPos(event);
    const dx = (x - mode.startX) / layout.displayWidth;
    const dy = (y - mode.startY) / layout.displayHeight;
    setCrop(resizeRect(mode.startRect, mode.handle, dx, dy));
  };

  const onPointerUp = (event: ReactPointerEvent) => {
    if (overlayRef.current?.hasPointerCapture(event.pointerId)) {
      overlayRef.current.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  };

  const handleCropAndDownload = async () => {
    if (!imageSrc || !sourceFile || !naturalSize || busy) return;

    setBusy(true);
    setError("");

    try {
      const pixelCrop = normalizedCropToPixels(crop, naturalSize.width, naturalSize.height);
      const blob = await getCroppedImageBlob(imageSrc, pixelCrop);
      const filename = cropImageOutputName(sourceFile.name);
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
      registerFile(sourceFile, slug);
      setShowFeedback(true);
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

  return (
    <div className={clsx("crop-image-tool", className)}>
      {!imageSrc ? (
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectFile}
          selectAria={labels.selectFileAria}
          dropHint={labels.dropHint}
          supportedFormats={["JPG", "PNG", "WEBP", "GIF", "HEIC"]}
          accept={ACCEPT}
          onFiles={(files) => {
            const file = Array.from(files)[0];
            if (file) void loadFile(file);
          }}
        />
      ) : (
        <div className="crop-image-tool__workspace">
          <p className="crop-image-tool__instructions">{labels.cropInstructions}</p>

          <Magnifier zoom={2} size={160} shape="rounded">
          <div ref={stageRef} className="crop-image-tool__stage">
            <img
              src={imageSrc}
              alt=""
              className="crop-image-tool__img"
              draggable={false}
              onLoad={(event) => {
                const img = event.currentTarget;
                setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
              }}
            />

            {layout ? (
              <div
                ref={overlayRef}
                className="crop-image-tool__overlay"
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
                <div className="crop-image-tool__frame" style={frameStyle}>
                  <div className="crop-image-tool__grid" aria-hidden />
                </div>

                {HANDLES.map((handle) => (
                  <span
                    key={handle}
                    className="crop-image-tool__handle"
                    style={handleStyle(handle, crop)}
                    aria-hidden
                  />
                ))}
              </div>
            ) : null}
          </div>
          </Magnifier>

          {showFeedback ? <ToolSuccessEngagement pageTitle={headline} /> : null}

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
              onClick={() => void handleCropAndDownload()}
              disabled={busy || !naturalSize}
            >
              {busy ? labels.cropping : labels.cropAndDownload}
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
