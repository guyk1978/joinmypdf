"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";
import { WORKSPACE_PHASE_CLEAN_CLASS } from "@/lib/workspace-flow";
import {
  TOOL_EMBED_HEIGHT_MESSAGE,
  TOOL_EMBED_HEIGHT_REQUEST_MESSAGE,
} from "@/lib/workspace-project-messages";

function isEmbedFromLocation(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("embed") === "1";
  } catch {
    return false;
  }
}

function isCleanPhase(): boolean {
  if (document.documentElement.classList.contains(WORKSPACE_PHASE_CLEAN_CLASS)) {
    return true;
  }
  return Boolean(
    document.querySelector(
      '#tool-workspace[data-workspace-phase="clean"], #workspace-upload[data-workspace-phase="clean"], .tool-upload-float[data-workspace-phase="clean"]',
    ),
  );
}

/**
 * Marks the document when a tool page is loaded inside the ToolModal iframe
 * so site chrome (header/footer) and marketing blocks can be suppressed via CSS/layout.
 * Reports fill-height to the parent so the iframe stays locked to the modal rail.
 */
export function ToolEmbedModeMarker() {
  const searchParams = useSearchParams();
  const embedFromParams = searchParams.get("embed") === "1";

  // Mark embed before paint so overflow-y:auto document-scroll rules never win
  // inside the modal iframe (stacked scrollbars + two Next.js N badges).
  useLayoutEffect(() => {
    const embed = embedFromParams || isEmbedFromLocation();
    if (!embed) {
      document.documentElement.removeAttribute("data-tool-embed");
      document.body.classList.remove("tool-embed-mode");
      return;
    }
    document.documentElement.setAttribute("data-tool-embed", "1");
    document.body.classList.add("tool-embed-mode");
    return () => {
      document.documentElement.removeAttribute("data-tool-embed");
      document.body.classList.remove("tool-embed-mode");
    };
  }, [embedFromParams]);

  useEffect(() => {
    const embed = embedFromParams || isEmbedFromLocation();
    if (!embed) return;
    let lastPayload = "";
    let raf = 0;
    const reportHeight = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (window.parent === window) return;
        try {
          // Always fill the parent modal rail. Content-height postMessage caused
          // an endless iframe growth loop; Overview/FAQ scroll inside the iframe.
          const payload = {
            type: TOOL_EMBED_HEIGHT_MESSAGE,
            mode: "fill",
            phase: isCleanPhase() ? "clean" : "active",
          };
          const serialized = JSON.stringify(payload);
          if (serialized === lastPayload) return;
          lastPayload = serialized;
          window.parent.postMessage(payload, "*");
        } catch {
          // Cross-origin parent — ignore.
        }
      });
    };

    reportHeight();
    // Parent may miss early posts (listener not ready / layout not settled).
    const retryTimers = [0, 50, 150, 400, 800, 1600, 3200].map((ms) =>
      window.setTimeout(reportHeight, ms),
    );

    const onParentRequest = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if ((data as { type?: string }).type !== TOOL_EMBED_HEIGHT_REQUEST_MESSAGE) {
        return;
      }
      // Allow a fresh measurement even if the last payload matched.
      lastPayload = "";
      reportHeight();
    };
    window.addEventListener("message", onParentRequest);

    const resizeObserver = new ResizeObserver(reportHeight);
    resizeObserver.observe(document.documentElement);
    if (document.body) resizeObserver.observe(document.body);

    const mutationObserver = new MutationObserver(reportHeight);
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    for (const id of ["tool-workspace", "workspace-upload"] as const) {
      const el = document.getElementById(id);
      if (el) {
        mutationObserver.observe(el, {
          attributes: true,
          attributeFilter: ["data-workspace-phase"],
          childList: true,
          subtree: true,
        });
        resizeObserver.observe(el);
      }
    }

    const float = document.querySelector(".tool-upload-float");
    if (float) {
      mutationObserver.observe(float, { childList: true, subtree: true });
      resizeObserver.observe(float);
    }

    const overview = document.querySelector(".tool-workspace-overview");
    if (overview) resizeObserver.observe(overview);

    // FAQ expand/collapse changes content height without always resizing overview box
    // in a way ResizeObserver catches immediately — listen for clicks too.
    document.addEventListener("click", reportHeight, true);

    window.addEventListener("load", reportHeight);
    window.addEventListener("resize", reportHeight);

    return () => {
      cancelAnimationFrame(raf);
      retryTimers.forEach((id) => window.clearTimeout(id));
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      document.removeEventListener("click", reportHeight, true);
      window.removeEventListener("load", reportHeight);
      window.removeEventListener("resize", reportHeight);
      window.removeEventListener("message", onParentRequest);
    };
  }, [embedFromParams]);

  return null;
}
