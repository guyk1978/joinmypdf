"use client";

import { usePdfThumbnailBlit } from "@/hooks/usePdfThumbnailBlit";
import { PDF_THUMB_SCALE } from "@/lib/pdf-render";
import { clsx } from "clsx";

type PdfThumbCanvasProps = {
  fileBytes: Uint8Array;
  pageIndex: number;
  password?: string;
  scale?: number;
  loadingLabel?: string;
  failedLabel?: string;
  /** When false, defer render until visible (caller manages IntersectionObserver). */
  enabled?: boolean;
  wrapClassName?: string;
  canvasClassName?: string;
  loadingClassName?: string;
};

/**
 * Shared PDF thumbnail with loading + friendly failure states.
 */
export function PdfThumbCanvas({
  fileBytes,
  pageIndex,
  password = "",
  scale = PDF_THUMB_SCALE,
  loadingLabel = "Rendering page…",
  failedLabel,
  enabled = true,
  wrapClassName,
  canvasClassName,
  loadingClassName,
}: PdfThumbCanvasProps) {
  const { canvasRef, loading, failed, errorMessage } = usePdfThumbnailBlit({
    fileBytes,
    pageIndex,
    password,
    scale,
    enabled,
  });

  return (
    <div className={clsx("page-manage-thumb__canvas-wrap", wrapClassName)}>
      {loading ? (
        <p className={clsx("page-manage-thumb__loading", loadingClassName)}>{loadingLabel}</p>
      ) : null}
      {failed ? (
        <p className={clsx("page-manage-thumb__loading", loadingClassName)} role="alert">
          {failedLabel || errorMessage || "Could not render this page."}
        </p>
      ) : (
        <canvas
          ref={canvasRef}
          className={clsx("page-manage-thumb__canvas", canvasClassName)}
          aria-hidden={loading}
        />
      )}
    </div>
  );
}
