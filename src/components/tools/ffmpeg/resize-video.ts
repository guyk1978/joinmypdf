import {
  formatVideoFfmpegError,
  runVideoFfmpeg,
  videoOutputBaseName,
  type VideoFfmpegOptions,
} from "@/components/tools/ffmpeg/video-ffmpeg-base";

export type AspectRatioPresetId = "9:16" | "1:1" | "16:9" | "custom";

export type AspectRatioPreset = {
  id: Exclude<AspectRatioPresetId, "custom">;
  labelKey: "preset916" | "preset11" | "preset169";
  ratioLabel: string;
  /** Output width × height for the preset. */
  width: number;
  height: number;
};

export const ASPECT_RATIO_PRESETS: readonly AspectRatioPreset[] = [
  { id: "9:16", labelKey: "preset916", ratioLabel: "9:16", width: 1080, height: 1920 },
  { id: "1:1", labelKey: "preset11", ratioLabel: "1:1", width: 1080, height: 1080 },
  { id: "16:9", labelKey: "preset169", ratioLabel: "16:9", width: 1920, height: 1080 },
] as const;

export type ResizeVideoOptions = {
  /** Source video pixel size (from HTMLVideoElement / metadata). */
  sourceWidth: number;
  sourceHeight: number;
  /** Final encoded size. */
  outputWidth: number;
  outputHeight: number;
};

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Force even integers — required by many H.264 encoders / yuv420p. */
export function evenFloor(value: number): number {
  const n = Math.max(2, Math.floor(value));
  return n % 2 === 0 ? n : n - 1;
}

/**
 * Largest centered crop of `outputWidth:outputHeight` aspect from the source frame.
 */
export function computeCenterCrop(
  sourceWidth: number,
  sourceHeight: number,
  outputWidth: number,
  outputHeight: number,
): CropRect {
  const srcW = Math.max(1, sourceWidth);
  const srcH = Math.max(1, sourceHeight);
  const targetAspect = outputWidth / outputHeight;
  const sourceAspect = srcW / srcH;

  let width: number;
  let height: number;
  let x: number;
  let y: number;

  if (sourceAspect > targetAspect) {
    height = srcH;
    width = srcH * targetAspect;
    x = (srcW - width) / 2;
    y = 0;
  } else {
    width = srcW;
    height = srcW / targetAspect;
    x = 0;
    y = (srcH - height) / 2;
  }

  return {
    x: evenFloor(x),
    y: evenFloor(y),
    width: evenFloor(width),
    height: evenFloor(height),
  };
}

/**
 * `ffmpeg -i input.mp4 -vf "crop=w:h:x:y,scale=width:height:flags=lanczos" -c:a copy output.mp4`
 */
export function buildResizeVideoArgs(
  inputName: string,
  outputName: string,
  options: ResizeVideoOptions,
): string[] {
  const outW = evenFloor(options.outputWidth);
  const outH = evenFloor(options.outputHeight);
  const crop = computeCenterCrop(
    options.sourceWidth,
    options.sourceHeight,
    outW,
    outH,
  );

  const vf = `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y},scale=${outW}:${outH}:flags=lanczos`;

  return ["-i", inputName, "-vf", vf, "-c:a", "copy", "-movflags", "+faststart", outputName];
}

export function isValidResizeDimensions(width: number, height: number): boolean {
  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width >= 16 &&
    height >= 16 &&
    width <= 7680 &&
    height <= 7680
  );
}

export async function resizeVideo(
  file: File,
  options: ResizeVideoOptions,
  callbacks: VideoFfmpegOptions = {},
): Promise<Blob> {
  if (
    !isValidResizeDimensions(options.outputWidth, options.outputHeight) ||
    options.sourceWidth < 2 ||
    options.sourceHeight < 2
  ) {
    throw new Error("Enter valid width and height (at least 16×16).");
  }

  return runVideoFfmpeg(
    file,
    (inputName, outputName) => buildResizeVideoArgs(inputName, outputName, options),
    "output.mp4",
    "video/mp4",
    callbacks,
  );
}

export function resizeVideoOutputName(
  fileName: string,
  outputWidth: number,
  outputHeight: number,
): string {
  return `${videoOutputBaseName(fileName)}-${evenFloor(outputWidth)}x${evenFloor(outputHeight)}.mp4`;
}

export function formatResizeVideoError(error: unknown): string {
  return formatVideoFfmpegError(error);
}
