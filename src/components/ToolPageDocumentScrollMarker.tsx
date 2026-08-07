"use client";

import { useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";
import { setToolPageDocumentScroll } from "@/lib/workspace-flow";

/**
 * Marks tool routes for single document scrollbar as soon as the tools
 * layout mounts (before WorkspaceUploadShell may hydrate).
 * Skip embed iframes — the parent tool modal is the scrollport there.
 */
export function ToolPageDocumentScrollMarker() {
  const searchParams = useSearchParams();
  const embed = searchParams.get("embed") === "1";

  useLayoutEffect(() => {
    if (embed) {
      setToolPageDocumentScroll(false);
      return;
    }
    setToolPageDocumentScroll(true);
    return () => setToolPageDocumentScroll(false);
  }, [embed]);

  return null;
}
