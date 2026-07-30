"use client";

import { useEffect } from "react";
import { TOOL_EMBED_HEIGHT_MESSAGE } from "@/lib/workspace-project-messages";

/**
 * Marks the document when a tool page is loaded inside the ToolModal iframe
 * so site chrome (header/footer) and marketing blocks can be suppressed via CSS/layout.
 * Also reports content height to the parent so the modal can use document scroll
 * instead of an inner iframe scrollbar.
 */
export function ToolEmbedModeMarker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const embed = params.get("embed") === "1";
    if (!embed) return;

    document.documentElement.setAttribute("data-tool-embed", "1");
    document.body.classList.add("tool-embed-mode");

    let raf = 0;
    const reportHeight = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (window.parent === window) return;
        const height = Math.max(
          document.documentElement.scrollHeight,
          document.body?.scrollHeight ?? 0,
          document.documentElement.offsetHeight,
        );
        try {
          window.parent.postMessage(
            { type: TOOL_EMBED_HEIGHT_MESSAGE, height },
            "*",
          );
        } catch {
          // Cross-origin parent — ignore.
        }
      });
    };

    reportHeight();
    const observer = new ResizeObserver(reportHeight);
    observer.observe(document.documentElement);
    if (document.body) observer.observe(document.body);
    window.addEventListener("load", reportHeight);
    window.addEventListener("resize", reportHeight);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("load", reportHeight);
      window.removeEventListener("resize", reportHeight);
      document.documentElement.removeAttribute("data-tool-embed");
      document.body.classList.remove("tool-embed-mode");
    };
  }, []);

  return null;
}
