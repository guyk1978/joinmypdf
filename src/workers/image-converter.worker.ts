/// <reference lib="webworker" />

export type ImageConverterWorkerRequest = {
  type: "convert";
  bitmap: ImageBitmap;
  mimeType: string;
  quality: number;
};

export type ImageConverterWorkerResponse =
  | { type: "ok"; buffer: ArrayBuffer; mimeType: string }
  | { type: "error"; message: string };

self.onmessage = async (event: MessageEvent<ImageConverterWorkerRequest>) => {
  const reply = (payload: ImageConverterWorkerResponse, transfer?: Transferable[]) => {
    (self as DedicatedWorkerGlobalScope).postMessage(payload, transfer ?? []);
  };

  try {
    const { bitmap, mimeType, quality } = event.data;
    if (!(bitmap instanceof ImageBitmap)) {
      throw new Error("Invalid image bitmap.");
    }

    const width = Math.max(1, bitmap.width);
    const height = Math.max(1, bitmap.height);
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      throw new Error("OffscreenCanvas 2D is not available in this browser.");
    }

    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blobOptions: ImageEncodeOptions =
      mimeType === "image/png" ? { type: mimeType } : { type: mimeType, quality };

    const blob = await canvas.convertToBlob(blobOptions);
    const buffer = await blob.arrayBuffer();
    reply({ type: "ok", buffer, mimeType }, [buffer]);
  } catch (error) {
    reply({
      type: "error",
      message: error instanceof Error ? error.message : "Image conversion failed in worker.",
    });
  }
};

export {};
