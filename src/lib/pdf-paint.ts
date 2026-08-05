/**
 * Low-level pdf.js canvas painting with soft failure tolerance for scanned PDFs.
 * Kept separate from pdf-reader / pdf-render to avoid circular imports.
 *
 * IMPORTANT (pdf.js ≥4/5): pass `canvas` OR `canvasContext` (with canvas:null),
 * not both — dual args can produce a blank white bitmap.
 */

export type PdfPaintBackground = "opaque-white" | "transparent";

type PdfJsPageLike = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: never) => {
    promise: Promise<void>;
    cancel?: () => void;
  };
};

const RENDER_TIMEOUT_MS = 90_000;
const DEBUG_PDF_PAINT =
  typeof process !== "undefined" && process.env.NODE_ENV === "development";

export function isPdfRenderCancelled(error: unknown): boolean {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /RenderingCancelledException|cancel(led)?/i.test(`${name} ${message}`);
}

/** Font / operator issues that should not blank an already-painted scanned page. */
export function isPdfSoftRenderError(error: unknown): boolean {
  const text = (
    error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "")
  ).toLowerCase();
  return (
    /font|glyph|cmap|cff|truetype|opentype|ots parsing|translatefont|missing.*font|operator|unknown.*command|jp2|jpeg2000|jbig2|imagedecode|decode.*image|wasm|optionalcontent/i.test(
      text,
    ) && !isPdfRenderCancelled(error)
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s.`));
    }, ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function logPaint(...args: unknown[]) {
  if (DEBUG_PDF_PAINT) {
    // eslint-disable-next-line no-console -- intentional diagnostic for blank-canvas debugging
    console.info("[pdf-paint]", ...args);
  }
}

/** Sample the bitmap for non-near-white / non-transparent ink (scanned pages, forms, stamps). */
export function canvasHasVisibleInk(
  canvas: HTMLCanvasElement,
  options?: { whiteThreshold?: number; minInkRatio?: number },
): boolean {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;
  const width = canvas.width;
  const height = canvas.height;
  if (width < 2 || height < 2) return false;

  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, width, height);
  } catch {
    // Tainted canvas — assume paint succeeded.
    return true;
  }

  const whiteThreshold = options?.whiteThreshold ?? 250;
  const minInkRatio = options?.minInkRatio ?? 0.0004;
  const { data: pixels } = data;
  const step = Math.max(4, Math.floor((width * height) / 12_000) * 4);
  let ink = 0;
  let samples = 0;

  for (let i = 0; i < pixels.length; i += step) {
    const r = pixels[i] ?? 255;
    const g = pixels[i + 1] ?? 255;
    const b = pixels[i + 2] ?? 255;
    const a = pixels[i + 3] ?? 255;
    samples += 1;
    if (a < 8) continue;
    if (r < whiteThreshold || g < whiteThreshold || b < whiteThreshold) {
      ink += 1;
    }
  }

  return samples > 0 && ink / samples >= minInkRatio;
}

/**
 * Size the canvas bitmap to the viewport. Do not create a 2d context with
 * custom attributes here — pdf.js 5 owns context creation via the `canvas` param.
 */
export function sizePaintCanvas(
  canvas: HTMLCanvasElement,
  viewport: { width: number; height: number },
  background: PdfPaintBackground = "opaque-white",
): { width: number; height: number } {
  const width = Math.max(1, Math.ceil(viewport.width));
  const height = Math.max(1, Math.ceil(viewport.height));

  // Assigning width/height resets the bitmap — intentional before each paint.
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  if (background === "opaque-white") {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
  }

  return { width, height };
}

async function runPageRender(
  page: PdfJsPageLike,
  params: Record<string, unknown>,
): Promise<void> {
  logPaint("page.render start", {
    canvasW: (params.canvas as HTMLCanvasElement | null)?.width,
    canvasH: (params.canvas as HTMLCanvasElement | null)?.height,
    viewportW: (params.viewport as { width?: number } | undefined)?.width,
    viewportH: (params.viewport as { height?: number } | undefined)?.height,
    hasCanvas: Boolean(params.canvas),
    hasContext: Boolean(params.canvasContext),
  });
  const task = page.render(params as never);
  try {
    await withTimeout(task.promise, RENDER_TIMEOUT_MS, "PDF page render");
    logPaint("page.render resolved");
  } catch (error) {
    logPaint("page.render rejected", error);
    if (typeof task.cancel === "function") {
      try {
        task.cancel();
      } catch {
        /* ignore */
      }
    }
    throw error;
  }
}

/**
 * Paint a PDF page onto a canvas using the pdf.js 5 `canvas` parameter
 * (not canvasContext+canvas together). Soft failures keep partial ink.
 */
export async function paintPdfPageToCanvas(options: {
  page: PdfJsPageLike;
  canvas: HTMLCanvasElement;
  scale: number;
  background?: PdfPaintBackground;
}): Promise<{ width: number; height: number; softError?: unknown }> {
  const background = options.background ?? "opaque-white";
  const scale = Number.isFinite(options.scale) && options.scale > 0 ? options.scale : 1;
  const viewport = options.page.getViewport({ scale });

  if (!(viewport.width > 0) || !(viewport.height > 0)) {
    throw new Error(
      `Invalid PDF viewport size (${viewport.width}×${viewport.height}) at scale ${scale}.`,
    );
  }

  const { width, height } = sizePaintCanvas(options.canvas, viewport, background);
  if (width < 1 || height < 1) {
    throw new Error(`Canvas bitmap collapsed to ${width}×${height}.`);
  }

  // pdf.js ≥4: prefer `canvas` alone. Passing canvasContext alongside can blank the paint.
  const baseParams: Record<string, unknown> = {
    canvas: options.canvas,
    viewport,
    intent: "display",
  };
  if (background === "opaque-white") {
    baseParams.background = "#ffffff";
  }

  try {
    await runPageRender(options.page, baseParams);
    if (!canvasHasVisibleInk(options.canvas)) {
      logPaint("render resolved but canvas has no visible ink — retrying without annotations");
      sizePaintCanvas(options.canvas, viewport, background);
      await runPageRender(options.page, {
        canvas: options.canvas,
        viewport,
        intent: "display",
        annotationMode: 0,
        ...(background === "opaque-white" ? { background: "#ffffff" } : {}),
      });
    }
    if (!canvasHasVisibleInk(options.canvas)) {
      throw new Error(
        "PDF page rendered blank. Scanned pages may need JBIG2/JPEG2000 wasm decoders.",
      );
    }
    return { width: viewport.width, height: viewport.height };
  } catch (error) {
    if (isPdfRenderCancelled(error)) throw error;

    if (canvasHasVisibleInk(options.canvas)) {
      return { width: viewport.width, height: viewport.height, softError: error };
    }

    // Last resort: legacy canvasContext path (canvas must be null per pdf.js docs).
    sizePaintCanvas(options.canvas, viewport, background);
    const ctx = options.canvas.getContext("2d");
    if (!ctx) throw error;
    try {
      await runPageRender(options.page, {
        canvas: null,
        canvasContext: ctx,
        viewport,
        intent: "display",
        ...(background === "opaque-white" ? { background: "#ffffff" } : {}),
      });
      if (canvasHasVisibleInk(options.canvas)) {
        return { width: viewport.width, height: viewport.height, softError: error };
      }
    } catch (legacyError) {
      if (isPdfRenderCancelled(legacyError)) throw legacyError;
      if (canvasHasVisibleInk(options.canvas)) {
        return { width: viewport.width, height: viewport.height, softError: legacyError };
      }
      throw legacyError;
    }

    throw error;
  }
}
