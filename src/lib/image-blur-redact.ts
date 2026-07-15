import {
  createImage,
  isAcceptedImageFile,
  loadImageFileForCrop,
} from "@/lib/crop-image";

export { isAcceptedImageFile, loadImageFileForCrop };

export type RedactMode = "blur" | "pixelate" | "solid";

export type RedactRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RedactRegion = RedactRect & {
  id: string;
  mode: RedactMode;
  /** Blur radius (1–24) or pixelate block size (4–48). Ignored for solid. */
  intensity: number;
};

const JPEG_QUALITY = 0.92;

export function clampRect(rect: RedactRect, canvasW: number, canvasH: number): RedactRect {
  const x1 = Math.max(0, Math.min(canvasW, Math.min(rect.x, rect.x + rect.width)));
  const y1 = Math.max(0, Math.min(canvasH, Math.min(rect.y, rect.y + rect.height)));
  const x2 = Math.max(0, Math.min(canvasW, Math.max(rect.x, rect.x + rect.width)));
  const y2 = Math.max(0, Math.min(canvasH, Math.max(rect.y, rect.y + rect.height)));
  return {
    x: Math.floor(x1),
    y: Math.floor(y1),
    width: Math.max(0, Math.ceil(x2 - x1)),
    height: Math.max(0, Math.ceil(y2 - y1)),
  };
}

export function normalizeRect(a: { x: number; y: number }, b: { x: number; y: number }): RedactRect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

function outputMimeForFile(file: File): { mime: string; quality?: number; extension: string } {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();

  if (type === "image/jpeg" || ext === "jpg" || ext === "jpeg") {
    return { mime: "image/jpeg", quality: JPEG_QUALITY, extension: "jpg" };
  }
  if (type === "image/webp" || ext === "webp") {
    return { mime: "image/webp", quality: JPEG_QUALITY, extension: "webp" };
  }
  if (type === "image/png" || ext === "png") {
    return { mime: "image/png", extension: "png" };
  }
  if (type === "image/gif" || ext === "gif") {
    return { mime: "image/png", extension: "png" };
  }

  return { mime: "image/png", extension: "png" };
}

export function redactImageOutputName(sourceName: string, mime: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "image";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  if (mime === "image/jpeg") return `${slug}-redacted.jpg`;
  if (mime === "image/webp") return `${slug}-redacted.webp`;
  return `${slug}-redacted.png`;
}

export function canvasToBlob(canvas: HTMLCanvasElement, file: File): Promise<Blob> {
  const { mime, quality } = outputMimeForFile(file);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export redacted image."));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Separable box blur on ImageData (in-place). */
export function applyBoxBlur(imageData: ImageData, radius: number): void {
  const r = Math.max(1, Math.min(24, Math.round(radius)));
  const { width, height, data } = imageData;
  const src = new Uint8ClampedArray(data);
  const tmp = new Uint8ClampedArray(data.length);
  const diam = r * 2 + 1;

  // Horizontal
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;
      let count = 0;
      for (let kx = -r; kx <= r; kx++) {
        const sx = Math.min(width - 1, Math.max(0, x + kx));
        const i = (y * width + sx) * 4;
        sumR += src[i]!;
        sumG += src[i + 1]!;
        sumB += src[i + 2]!;
        sumA += src[i + 3]!;
        count += 1;
      }
      const o = (y * width + x) * 4;
      tmp[o] = sumR / (count || diam);
      tmp[o + 1] = sumG / (count || diam);
      tmp[o + 2] = sumB / (count || diam);
      tmp[o + 3] = sumA / (count || diam);
    }
  }

  // Vertical
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;
      let count = 0;
      for (let ky = -r; ky <= r; ky++) {
        const sy = Math.min(height - 1, Math.max(0, y + ky));
        const i = (sy * width + x) * 4;
        sumR += tmp[i]!;
        sumG += tmp[i + 1]!;
        sumB += tmp[i + 2]!;
        sumA += tmp[i + 3]!;
        count += 1;
      }
      const o = (y * width + x) * 4;
      data[o] = sumR / (count || diam);
      data[o + 1] = sumG / (count || diam);
      data[o + 2] = sumB / (count || diam);
      data[o + 3] = sumA / (count || diam);
    }
  }
}

/** Mosaic / pixelate on ImageData (in-place). */
export function applyPixelate(imageData: ImageData, blockSize: number): void {
  const block = Math.max(2, Math.min(64, Math.round(blockSize)));
  const { width, height, data } = imageData;
  const src = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y += block) {
    for (let x = 0; x < width; x += block) {
      const bw = Math.min(block, width - x);
      const bh = Math.min(block, height - y);
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;
      let count = 0;

      for (let py = 0; py < bh; py++) {
        for (let px = 0; px < bw; px++) {
          const i = ((y + py) * width + (x + px)) * 4;
          sumR += src[i]!;
          sumG += src[i + 1]!;
          sumB += src[i + 2]!;
          sumA += src[i + 3]!;
          count += 1;
        }
      }

      const avgR = sumR / count;
      const avgG = sumG / count;
      const avgB = sumB / count;
      const avgA = sumA / count;

      for (let py = 0; py < bh; py++) {
        for (let px = 0; px < bw; px++) {
          const i = ((y + py) * width + (x + px)) * 4;
          data[i] = avgR;
          data[i + 1] = avgG;
          data[i + 2] = avgB;
          data[i + 3] = avgA;
        }
      }
    }
  }
}

export function applySolidBlack(imageData: ImageData): void {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    // keep alpha
  }
}

/** Apply a single redaction region onto canvas context. */
export function applyRegionToCanvas(
  ctx: CanvasRenderingContext2D,
  region: Pick<RedactRegion, "x" | "y" | "width" | "height" | "mode" | "intensity">,
): void {
  const rect = clampRect(region, ctx.canvas.width, ctx.canvas.height);
  if (rect.width < 1 || rect.height < 1) return;

  if (region.mode === "solid") {
    ctx.fillStyle = "#000000";
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    return;
  }

  const imageData = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
  if (region.mode === "blur") {
    applyBoxBlur(imageData, region.intensity);
  } else {
    applyPixelate(imageData, region.intensity);
  }
  ctx.putImageData(imageData, rect.x, rect.y);
}

export function redrawWithRegions(
  canvas: HTMLCanvasElement,
  source: HTMLImageElement | HTMLCanvasElement,
  regions: readonly RedactRegion[],
  preview?: Pick<RedactRegion, "x" | "y" | "width" | "height" | "mode" | "intensity"> | null,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");

  const width =
    "naturalWidth" in source
      ? Math.max(1, source.naturalWidth || source.width)
      : Math.max(1, source.width);
  const height =
    "naturalHeight" in source
      ? Math.max(1, source.naturalHeight || source.height)
      : Math.max(1, source.height);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);

  for (const region of regions) {
    applyRegionToCanvas(ctx, region);
  }
  if (preview && preview.width >= 2 && preview.height >= 2) {
    applyRegionToCanvas(ctx, preview);
  }
}

export type FaceBox = RedactRect;

type FaceDetectorLike = {
  detect: (image: CanvasImageSource) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
};

/** Experimental: Chromium FaceDetector API when available. */
export function isFaceDetectorSupported(): boolean {
  return typeof window !== "undefined" && "FaceDetector" in window;
}

export async function detectFacesOnCanvas(canvas: HTMLCanvasElement): Promise<FaceBox[]> {
  if (!isFaceDetectorSupported()) {
    throw new Error("FACE_DETECTOR_UNSUPPORTED");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FaceDetectorCtor = (window as any).FaceDetector as new (opts?: {
    fastMode?: boolean;
    maxDetectedFaces?: number;
  }) => FaceDetectorLike;

  const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 12 });
  const faces = await detector.detect(canvas);

  return faces
    .map((face) => {
      const box = face.boundingBox;
      const padX = box.width * 0.12;
      const padY = box.height * 0.16;
      return clampRect(
        {
          x: box.x - padX,
          y: box.y - padY,
          width: box.width + padX * 2,
          height: box.height + padY * 2,
        },
        canvas.width,
        canvas.height,
      );
    })
    .filter((box) => box.width >= 8 && box.height >= 8);
}

export async function loadRedactImage(file: File): Promise<{
  image: HTMLImageElement;
  objectUrl: string;
  width: number;
  height: number;
}> {
  if (!isAcceptedImageFile(file)) {
    throw new Error("UNSUPPORTED");
  }
  if (file.size === 0) {
    throw new Error("EMPTY");
  }

  const objectUrl = await loadImageFileForCrop(file);
  const image = await createImage(objectUrl);
  return {
    image,
    objectUrl,
    width: Math.max(1, image.naturalWidth || image.width),
    height: Math.max(1, image.naturalHeight || image.height),
  };
}

export function getCanvasPointer(
  canvas: HTMLCanvasElement,
  evt: { clientX: number; clientY: number },
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / Math.max(1, rect.width);
  const scaleY = canvas.height / Math.max(1, rect.height);
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
  };
}

export function createRegionId(): string {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
