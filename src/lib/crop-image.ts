export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MIME_PNG = "image/png";

function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export type ImageDisplayLayout = {
  offsetX: number;
  offsetY: number;
  displayWidth: number;
  displayHeight: number;
  scale: number;
};

export function getImageDisplayLayout(
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): ImageDisplayLayout {
  const scale = Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight);
  const displayWidth = naturalWidth * scale;
  const displayHeight = naturalHeight * scale;

  return {
    offsetX: (containerWidth - displayWidth) / 2,
    offsetY: (containerHeight - displayHeight) / 2,
    displayWidth,
    displayHeight,
    scale,
  };
}

export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

export async function loadImageFileForCrop(file: File): Promise<string> {
  const isHeic =
    /heic|heif/i.test(file.type) || /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name);

  if (isHeic) {
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 1 });
    const blob = Array.isArray(result) ? result[0] : result;
    if (!(blob instanceof Blob)) {
      throw new Error("HEIC conversion failed.");
    }
    return URL.createObjectURL(blob);
  }

  return URL.createObjectURL(file);
}

export function isAcceptedImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(file.name);
}

export function cropImageOutputName(sourceName: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "image";
  return `${base}-cropped.png`;
}

export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  const cropWidth = Math.max(1, Math.floor(pixelCrop.width));
  const cropHeight = Math.max(1, Math.floor(pixelCrop.height));

  canvas.width = cropWidth;
  canvas.height = cropHeight;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (rotation === 0) {
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      cropWidth,
      cropHeight,
    );
  } else {
    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

    ctx.translate(-pixelCrop.x, -pixelCrop.y);
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);
    ctx.drawImage(image, 0, 0);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export cropped image."));
          return;
        }
        resolve(blob);
      },
      MIME_PNG,
    );
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
