export type SvgOptimizeResult = {
  originalSvg: string;
  optimizedSvg: string;
  originalBytes: number;
  optimizedBytes: number;
  savingsPercent: number;
  fileName: string;
};

export type SvgOptimizeOptions = {
  /** Run SVGO multipass for stronger minification. */
  multipass?: boolean;
  /** Prefer slightly safer defaults (keeps viewBox / titles). */
  safe?: boolean;
};

const SVG_EXT_RE = /\.svg$/i;
const SVG_MIME_RE = /^image\/svg\+xml/i;

export function isSvgFile(file: File): boolean {
  return SVG_EXT_RE.test(file.name) || SVG_MIME_RE.test(file.type) || file.type === "text/xml";
}

export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function svgOptimizerOutputName(sourceName: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "image";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  return `${slug}.optimized.svg`;
}

export function savingsPercent(originalBytes: number, optimizedBytes: number): number {
  if (!originalBytes || optimizedBytes >= originalBytes) return 0;
  return Math.round(((originalBytes - optimizedBytes) / originalBytes) * 100);
}

export function looksLikeSvgMarkup(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^<\?xml[\s\S]*?<svg[\s>]/i.test(trimmed)) return true;
  return /<svg[\s>]/i.test(trimmed);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadSvgText(svg: string, filename: string): void {
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), filename);
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
}

/**
 * Optimize SVG markup with the official browser build (`svgo/browser`).
 * Dynamic import keeps Node-oriented SVGO entry points out of the client bundle path.
 */
export async function optimizeSvgMarkup(
  originalSvg: string,
  sourceName = "image.svg",
  options: SvgOptimizeOptions = {},
): Promise<SvgOptimizeResult> {
  const input = originalSvg.trim();
  if (!looksLikeSvgMarkup(input)) {
    throw new Error("This file does not look like a valid SVG.");
  }

  const { optimize } = await import("svgo/browser");

  const multipass = options.multipass ?? true;
  const safe = options.safe ?? true;

  const result = optimize(input, {
    multipass,
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: safe
            ? {
                // Keep scalability + accessibility by default.
                removeViewBox: false,
                removeTitle: false,
                removeDesc: false,
              }
            : {
                removeViewBox: false,
              },
        },
      },
      "removeComments",
      "removeMetadata",
      "removeEditorsNSData",
      "cleanupIds",
      "convertColors",
      "minifyStyles",
    ],
  } as Parameters<typeof optimize>[1]);

  const optimizedSvg = typeof result.data === "string" ? result.data.trim() : "";
  if (!optimizedSvg || !looksLikeSvgMarkup(optimizedSvg)) {
    throw new Error("SVGO could not optimize this SVG.");
  }

  const originalBytes = utf8ByteLength(input);
  const optimizedBytes = utf8ByteLength(optimizedSvg);

  return {
    originalSvg: input,
    optimizedSvg,
    originalBytes,
    optimizedBytes,
    savingsPercent: savingsPercent(originalBytes, optimizedBytes),
    fileName: svgOptimizerOutputName(sourceName),
  };
}

export async function optimizeSvgFile(
  file: File,
  options: SvgOptimizeOptions = {},
): Promise<SvgOptimizeResult> {
  if (!isSvgFile(file)) {
    throw new Error("Please choose an .svg file.");
  }

  const text = await file.text();
  return optimizeSvgMarkup(text, file.name, options);
}

export function svgPreviewObjectUrl(svg: string): string {
  return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
