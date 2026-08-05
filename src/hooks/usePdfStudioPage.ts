"use client";

import {
  friendlyPdfPreviewMessage,
  PDF_STUDIO_SCALE,
  renderPdfPageForUi,
} from "@/lib/pdf-render";
import { useEffect, useState } from "react";

/**
 * Loads a studio-scale page into an offscreen canvas with catch → error message.
 * Prefer blitting via useEffect on a stable display canvas (not a ref callback).
 */
export function usePdfStudioPage(options: {
  fileBytes: Uint8Array | null | undefined;
  pageIndex: number;
  password?: string;
  scale?: number;
  enabled?: boolean;
}) {
  const {
    fileBytes,
    pageIndex,
    password,
    scale = PDF_STUDIO_SCALE,
    enabled = true,
  } = options;

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(Boolean(fileBytes) && enabled);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!fileBytes || !enabled) {
      setCanvas(null);
      setLoading(false);
      setErrorMessage("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorMessage("");
    setCanvas(null);

    void renderPdfPageForUi(fileBytes, pageIndex, password, scale)
      .then(({ canvas: next }) => {
        if (cancelled) return;
        setCanvas(next);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setCanvas(null);
        setErrorMessage(friendlyPdfPreviewMessage(error));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fileBytes, pageIndex, password, scale, enabled]);

  return { canvas, loading, errorMessage, failed: Boolean(errorMessage) };
}
