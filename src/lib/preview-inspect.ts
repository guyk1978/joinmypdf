/**
 * Cross-frame preview inspection — the tool-modal header (parent) can request
 * a zoom lightbox over the active image/document preview, which often lives
 * inside the CALC embed iframe. Uses localStorage + postMessage like the
 * magnifier preference bridge.
 */

const STORAGE_KEY = "joinmypdf:preview-inspect";
const CHANGE_EVENT = "joinmypdf:preview-inspect";
export const PREVIEW_INSPECT_MESSAGE = "joinmypdf:preview-inspect";

export type PreviewInspectSource = {
  id: string;
  /** Prefer larger / more recently interacted previews. */
  getPriority: () => number;
  /** True when the source has something meaningful to show. */
  isAvailable: () => boolean;
  /** Build a bitmap/data URL (or return an existing image URL) for the lightbox. */
  capture: () => Promise<string | null> | string | null;
  label?: string;
};

const sources = new Map<string, PreviewInspectSource>();
let idSeq = 0;

export function registerPreviewInspectSource(
  source: Omit<PreviewInspectSource, "id"> & { id?: string },
): () => void {
  const id = source.id ?? `preview-${++idSeq}`;
  sources.set(id, { ...source, id });
  return () => {
    sources.delete(id);
  };
}

export function listPreviewInspectSources(): PreviewInspectSource[] {
  return Array.from(sources.values());
}

/** Highest-priority available registered source, if any. */
export function pickBestPreviewInspectSource(): PreviewInspectSource | null {
  let best: PreviewInspectSource | null = null;
  let bestPriority = -Infinity;
  for (const source of sources.values()) {
    if (!source.isAvailable()) continue;
    const priority = source.getPriority();
    if (priority > bestPriority) {
      best = source;
      bestPriority = priority;
    }
  }
  return best;
}

function notifySameWindow() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: Date.now() }));
}

function notifyIframes() {
  if (typeof document === "undefined") return;
  const payload = { type: PREVIEW_INSPECT_MESSAGE, at: Date.now() };
  document.querySelectorAll("iframe").forEach((frame) => {
    try {
      frame.contentWindow?.postMessage(payload, "*");
    } catch {
      // Cross-origin or detached frame — ignore.
    }
  });
}

/** Ask every frame (parent + embeds) to open the preview inspect lightbox. */
export function requestPreviewInspect() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Storage unavailable — same-window + postMessage still fire below.
  }
  notifySameWindow();
  notifyIframes();
}

export function subscribePreviewInspect(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onCustom = () => callback();
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || event.newValue == null) return;
    callback();
  };
  const onMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if ((data as { type?: string }).type !== PREVIEW_INSPECT_MESSAGE) return;
    callback();
  };

  window.addEventListener(CHANGE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  window.addEventListener("message", onMessage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("message", onMessage);
  };
}

/**
 * Prefer the largest in-tree canvas (PDF page renders, image tools) so deep
 * zoom inspects native pixel resolution rather than a downscaled CSS box.
 */
function pickLargestCanvas(root: ParentNode): HTMLCanvasElement | null {
  let best: HTMLCanvasElement | null = null;
  let bestArea = 0;
  root.querySelectorAll("canvas").forEach((node) => {
    if (!(node instanceof HTMLCanvasElement)) return;
    const area = node.width * node.height;
    if (area > bestArea) {
      best = node;
      bestArea = area;
    }
  });
  return best;
}

function canvasToDataUrl(canvas: HTMLCanvasElement): string | null {
  if (canvas.width <= 0 || canvas.height <= 0) return null;
  try {
    // PNG keeps sharp text/edges for deep zoom of document pages.
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** High-resolution capture for the inspect lightbox (PNG canvas or full image src). */
export function captureElementAsDataUrl(element: HTMLElement): string | null {
  if (element instanceof HTMLCanvasElement) {
    return canvasToDataUrl(element);
  }

  if (element instanceof HTMLImageElement && (element.currentSrc || element.src)) {
    return element.currentSrc || element.src;
  }

  const canvas = pickLargestCanvas(element);
  if (canvas) {
    const dataUrl = canvasToDataUrl(canvas);
    if (dataUrl) return dataUrl;
  }

  const img = element.querySelector("img");
  if (img instanceof HTMLImageElement && (img.currentSrc || img.src)) {
    return img.currentSrc || img.src;
  }

  return null;
}

/**
 * Scan the document for a sensible image/document preview when no Magnifier
 * registered a source (merge/split thumbnails, generic tool previews, etc.).
 */
export function findDomPreviewCandidate(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  const selectors = [
    ".magnifier__source",
    "[data-preview-inspect]",
    ".crop-image-tool__stage",
    ".crop-image-tool__img",
    ".pdf-studio-page",
    ".image-preview-grid img",
    ".tool-workspace img",
    "canvas.pdf-page-canvas",
    "img[src]:not([src=''])",
    "canvas",
  ];

  for (const selector of selectors) {
    const nodes = document.querySelectorAll(selector);
    for (const node of nodes) {
      if (!(node instanceof HTMLElement)) continue;
      if (!node.isConnected) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < 24 || rect.height < 24) continue;
      // Prefer elements that are at least partially in view.
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
      return node;
    }
  }
  return null;
}
