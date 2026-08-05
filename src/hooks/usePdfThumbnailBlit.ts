"use client";

import { blitCanvas, friendlyPdfPreviewMessage, renderPdfPageThumbnail } from "@/lib/pdf-render";
import { useEffect, useRef, useState } from "react";

/**
 * Blits a pdf.js thumbnail onto a stable canvas with loading + error states.
 * Replaces duplicated useEffect/.then chains that left spinners stuck forever.
 */
export function usePdfThumbnailBlit(options: {
  fileBytes: Uint8Array | null | undefined;
  pageIndex: number;
  password?: string;
  scale?: number;
  /** When false, skip rendering (e.g. IntersectionObserver not yet visible). */
  enabled?: boolean;
}) {
  const { fileBytes, pageIndex, password = "", scale, enabled = true } = options;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(Boolean(fileBytes) && enabled);
  const [failed, setFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!fileBytes || !enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setErrorMessage("");

    void renderPdfPageThumbnail(fileBytes, pageIndex, password, scale)
      .then((canvas) => {
        if (cancelled) return;
        const node = canvasRef.current;
        if (!node) {
          // Canvas may mount one tick later; retry once on next frame.
          requestAnimationFrame(() => {
            if (cancelled || !canvasRef.current) {
              if (!cancelled) {
                setFailed(true);
                setErrorMessage("Could not render this page.");
                setLoading(false);
              }
              return;
            }
            blitCanvas(canvas, canvasRef.current);
            setLoading(false);
          });
          return;
        }
        blitCanvas(canvas, node);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setFailed(true);
        setErrorMessage(friendlyPdfPreviewMessage(error));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fileBytes, pageIndex, password, scale, enabled]);

  return { canvasRef, loading, failed, errorMessage };
}
