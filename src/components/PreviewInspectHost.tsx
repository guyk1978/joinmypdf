"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { PreviewInspectOverlay } from "@/components/PreviewInspectOverlay";
import {
  captureElementAsDataUrl,
  findDomPreviewCandidate,
  pickBestPreviewInspectSource,
  subscribePreviewInspect,
} from "@/lib/preview-inspect";

/**
 * Listens for header magnifying-glass inspect requests (same window + iframe)
 * and opens the zoom lightbox for the best available preview.
 */
export function PreviewInspectHost() {
  const t = useTranslations("ToolModal");
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const lastOpenAt = useRef(0);

  const openInspect = useCallback(async () => {
    // Deduplicate storage + postMessage + CustomEvent arriving together.
    const now = Date.now();
    if (now - lastOpenAt.current < 350) return;
    lastOpenAt.current = now;

    const registered = pickBestPreviewInspectSource();
    if (registered) {
      const captured = await registered.capture();
      if (captured) {
        setSrc(captured);
        setOpen(true);
        return;
      }
    }

    const candidate = findDomPreviewCandidate();
    if (candidate) {
      const captured = captureElementAsDataUrl(candidate);
      if (captured) {
        setSrc(captured);
        setOpen(true);
        return;
      }
    }

    // Parent modal chrome has no preview of its own — embeds were already
    // notified by requestPreviewInspect(). Only show the empty state inside
    // the tool frame so we don't cover the whole app with a blank dialog.
    const isEmbedded =
      typeof window !== "undefined" && window.parent != null && window.parent !== window;
    if (isEmbedded) {
      setSrc(null);
      setOpen(true);
    }
  }, []);

  useEffect(
    () =>
      subscribePreviewInspect(() => {
        void openInspect();
      }),
    [openInspect],
  );

  return (
    <PreviewInspectOverlay
      open={open}
      src={src}
      title={t.has("inspectPreview") ? t("inspectPreview") : "Inspect preview"}
      emptyLabel={
        t.has("inspectPreviewEmpty")
          ? t("inspectPreviewEmpty")
          : "No preview available yet. Upload a file first."
      }
      closeLabel={t.has("closeInspect") ? t("closeInspect") : "Close preview"}
      zoomInLabel={t.has("zoomIn") ? t("zoomIn") : "Zoom in"}
      zoomOutLabel={t.has("zoomOut") ? t("zoomOut") : "Zoom out"}
      resetLabel={t.has("resetZoom") ? t("resetZoom") : "Reset zoom"}
      fitLabel={t.has("fitToScreen") ? t("fitToScreen") : "Fit to screen"}
      onClose={() => setOpen(false)}
    />
  );
}
