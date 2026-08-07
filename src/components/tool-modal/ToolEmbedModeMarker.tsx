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
 * Measure real tool content height without trusting document.scrollHeight.
 * Inside the modal iframe, html/body are stretched to the parent-assigned
 * iframe height, so scrollHeight never shrinks after a tall active layout
 * (feedback loop → stuck tall dropzone on "upload new file").
 */
function measureIntrinsicContentHeight(): number {
  const root =
    document.getElementById("tool-workspace") ||
    document.getElementById("workspace-upload") ||
    (document.querySelector(".app-page-canvas--tool-embed") as HTMLElement | null) ||
    document.body;

  const rootTop = root.getBoundingClientRect().top;
  let maxBottom = rootTop;

  const consider = (node: Element | null) => {
    if (!node) return;
    const rect = (node as HTMLElement).getBoundingClientRect();
    if (rect.height < 1) return;
    maxBottom = Math.max(maxBottom, rect.bottom);
  };

  root
    .querySelectorAll(
      [
        ".tool-upload-float",
        ".tool-workspace-overview",
        ".tool-workspace-panel",
        ".tool-page-view",
        ".utility-tool-layout",
        ".im-utility-stage",
        ".faq-accordion",
        ".community-reviews",
        "[data-embed-measure]",
      ].join(","),
    )
    .forEach(consider);

  Array.from(root.children).forEach(consider);

  const measured = Math.ceil(maxBottom - rootTop + 12);
  if (measured >= 120) return Math.max(measured, 200);

  // Last resort: never lock to an inflated iframe viewport.
  const viewport = Math.ceil(window.visualViewport?.height ?? window.innerHeight);
  return Math.max(400, viewport);
}

function hasPageScrollContent(): boolean {
  return Boolean(
    document.querySelector(
      [
        '.tool-upload-float[data-page-scroll="1"]',
        '.tool-upload-float[data-workspace-phase="clean"] > .tool-workspace-overview',
        ".tool-workspace-overview--page",
      ].join(","),
    ),
  );
}

/**
 * Marks the document when a tool page is loaded inside the ToolModal iframe
 * so site chrome (header/footer) and marketing blocks can be suppressed via CSS/layout.
 * Also reports content height to the parent so the modal can use document scroll
 * instead of an inner iframe scrollbar.
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
          let payload: Record<string, unknown>;
          // Page-scroll tools (Overview/FAQ) always report content height so the
          // parent modal is the only scrollbar — never fill-lock the iframe.
          if (isCleanPhase() && !hasPageScrollContent()) {
            payload = { type: TOOL_EMBED_HEIGHT_MESSAGE, mode: "fill", phase: "clean" };
          } else {
            const height = measureIntrinsicContentHeight();
            payload = {
              type: TOOL_EMBED_HEIGHT_MESSAGE,
              mode: "content",
              phase: isCleanPhase() ? "clean" : "active",
              height,
            };
          }
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
