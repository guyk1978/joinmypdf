/**
 * Lightweight document auto-deskew via projection-profile scoring.
 * Runs entirely in the browser — no uploads, no OCR required.
 */

export type DeskewProgress = {
  /** 0–1 */
  ratio: number;
  label?: string;
};

export type DeskewResult = {
  /** Correction angle in degrees (clockwise when applied). */
  angle: number;
  /** Relative score strength 0–1 for UI confidence. */
  confidence: number;
};

const DEFAULT_MAX_SIDE = 900;
const DEFAULT_MIN_ANGLE = -15;
const DEFAULT_MAX_ANGLE = 15;
const COARSE_STEP = 1;
const FINE_STEP = 0.25;

function yieldFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for deskew."));
    image.src = src;
  });
}

function buildGraySample(image: HTMLImageElement, maxSide: number): {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  data: Uint8ClampedArray;
} {
  const srcW = Math.max(1, image.naturalWidth || image.width);
  const srcH = Math.max(1, image.naturalHeight || image.height);
  const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");

  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  // In-place grayscale + mild contrast for edge-ish projection
  const contrast = 1.35;
  const intercept = 128 * (1 - contrast);
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    const value = Math.max(0, Math.min(255, gray * contrast + intercept));
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);

  return { canvas, width, height, data };
}

/**
 * Score how "aligned" the image is at a candidate rotate angle.
 * Higher variance of horizontal projection ≈ sharper text/line rows.
 */
function scoreAngle(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  angleDeg: number,
): number {
  const radians = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;

  const projection = new Float64Array(height);
  const counts = new Float64Array(height);

  // Subsample for speed
  const stepX = width > 640 ? 2 : 1;
  const stepY = height > 640 ? 2 : 1;

  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const dx = x - cx;
      const dy = y - cy;
      const sx = Math.round(cx + dx * cos - dy * sin);
      const sy = Math.round(cy + dx * sin + dy * cos);
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;

      const idx = (sy * width + sx) * 4;
      const gray = data[idx] ?? 0;
      // Emphasize dark ink-like pixels for documents
      const ink = 255 - gray;
      projection[y]! += ink;
      counts[y]! += 1;
    }
  }

  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 0; y < height; y += stepY) {
    const c = counts[y]!;
    if (c <= 0) continue;
    const mean = projection[y]! / c;
    sum += mean;
    sumSq += mean * mean;
    n += 1;
  }

  if (n < 8) return 0;
  const avg = sum / n;
  return sumSq / n - avg * avg;
}

async function scanAngles(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  from: number,
  to: number,
  step: number,
  onProgress?: (progress: DeskewProgress) => void,
  progressFrom = 0,
  progressTo = 1,
): Promise<{ angle: number; score: number }> {
  let bestAngle = 0;
  let bestScore = -Infinity;
  const span = Math.max(step, to - from);
  const total = Math.floor(span / step) + 1;
  let i = 0;

  for (let angle = from; angle <= to + 1e-9; angle += step) {
    const rounded = Math.round(angle * 100) / 100;
    const score = scoreAngle(data, width, height, rounded);
    if (score > bestScore) {
      bestScore = score;
      bestAngle = rounded;
    }
    i += 1;
    if (i % 3 === 0) {
      const local = total <= 1 ? 1 : i / total;
      onProgress?.({
        ratio: progressFrom + (progressTo - progressFrom) * local,
      });
      await yieldFrame();
    }
  }

  return { angle: bestAngle, score: bestScore };
}

/**
 * Detect a small deskew correction angle for scanned documents / photos of pages.
 * Returns degrees to rotate clockwise to straighten content.
 */
export async function detectDeskewAngle(
  imageSrc: string,
  options?: {
    maxSide?: number;
    minAngle?: number;
    maxAngle?: number;
    onProgress?: (progress: DeskewProgress) => void;
  },
): Promise<DeskewResult> {
  const maxSide = options?.maxSide ?? DEFAULT_MAX_SIDE;
  const minAngle = options?.minAngle ?? DEFAULT_MIN_ANGLE;
  const maxAngle = options?.maxAngle ?? DEFAULT_MAX_ANGLE;
  const onProgress = options?.onProgress;

  onProgress?.({ ratio: 0.02 });
  const image = await loadImageElement(imageSrc);
  onProgress?.({ ratio: 0.08 });
  const sample = buildGraySample(image, maxSide);
  onProgress?.({ ratio: 0.12 });

  const coarse = await scanAngles(
    sample.data,
    sample.width,
    sample.height,
    minAngle,
    maxAngle,
    COARSE_STEP,
    onProgress,
    0.12,
    0.72,
  );

  const fineFrom = Math.max(minAngle, coarse.angle - COARSE_STEP);
  const fineTo = Math.min(maxAngle, coarse.angle + COARSE_STEP);
  const fine = await scanAngles(
    sample.data,
    sample.width,
    sample.height,
    fineFrom,
    fineTo,
    FINE_STEP,
    onProgress,
    0.72,
    0.98,
  );

  // Negate: if content is skewed +θ in sampling space, applying −θ straightens preview
  // Our scoreAngle samples as-if-rotated; bestAngle is the skew amount of the source,
  // so correction is -bestAngle.
  const angle = Math.round(-fine.angle * 100) / 100;

  // Confidence: compare best vs median-ish floor — clamp and damp if near 0
  const abs = Math.abs(angle);
  const confidence =
    abs < 0.15
      ? 0.15
      : Math.min(1, 0.35 + abs / Math.max(1, maxAngle - minAngle) + Math.min(0.4, fine.score / 1e8));

  onProgress?.({ ratio: 1 });

  return { angle, confidence };
}
