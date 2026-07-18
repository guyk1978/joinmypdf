export type ImageCombinerLayout = "horizontal" | "vertical";

export type LoadedCombinerImage = {
  image: HTMLImageElement;
  width: number;
  height: number;
};

const MAX_CANVAS_EDGE = 16_384;
const MAX_CANVAS_PIXELS = 64_000_000;

export function isImageCombinerFile(file: File): boolean {
  return (
    ["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    /\.(jpe?g|png|webp)$/i.test(file.name)
  );
}

export function loadCombinerImage(url: string): Promise<LoadedCombinerImage> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => reject(new Error("Could not decode image."));
    image.src = url;
  });
}

function getNaturalLayout(
  images: readonly LoadedCombinerImage[],
  layout: ImageCombinerLayout,
): {
  width: number;
  height: number;
  placements: { x: number; y: number; width: number; height: number }[];
} {
  if (layout === "horizontal") {
    const height = Math.max(...images.map((item) => item.height));
    let x = 0;
    const placements = images.map((item) => {
      const width = Math.max(1, Math.round(item.width * (height / item.height)));
      const placement = { x, y: 0, width, height };
      x += width;
      return placement;
    });
    return { width: x, height, placements };
  }

  const width = Math.max(...images.map((item) => item.width));
  let y = 0;
  const placements = images.map((item) => {
    const height = Math.max(1, Math.round(item.height * (width / item.width)));
    const placement = { x: 0, y, width, height };
    y += height;
    return placement;
  });
  return { width, height: y, placements };
}

function getSafeScale(width: number, height: number): number {
  const edgeScale = Math.min(1, MAX_CANVAS_EDGE / Math.max(width, height));
  const pixelScale = Math.min(1, Math.sqrt(MAX_CANVAS_PIXELS / (width * height)));
  return Math.min(edgeScale, pixelScale);
}

export async function combineImages(
  images: readonly LoadedCombinerImage[],
  layout: ImageCombinerLayout,
): Promise<{ blob: Blob; width: number; height: number }> {
  if (images.length < 2 || images.length > 4) {
    throw new Error("Image Combiner requires between 2 and 4 images.");
  }

  const natural = getNaturalLayout(images, layout);
  const scale = getSafeScale(natural.width, natural.height);
  const width = Math.max(1, Math.round(natural.width * scale));
  const height = Math.max(1, Math.round(natural.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, width, height);

  images.forEach((item, index) => {
    const placement = natural.placements[index];
    context.drawImage(
      item.image,
      Math.round(placement.x * scale),
      Math.round(placement.y * scale),
      Math.max(1, Math.round(placement.width * scale)),
      Math.max(1, Math.round(placement.height * scale)),
    );
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Could not export the combined image."));
    }, "image/png");
  });

  return { blob, width, height };
}

export function imageCombinerOutputName(files: readonly File[]): string {
  const firstBase = files[0]?.name.replace(/\.[^.]+$/, "") || "images";
  return `${firstBase}-combined.png`;
}
