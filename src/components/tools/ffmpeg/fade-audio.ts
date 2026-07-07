import { fetchFile } from "@ffmpeg/util";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type FadeDurations = {
  fadeInSeconds: number;
  fadeOutSeconds: number;
};

export type ApplyFadeOptions = FadeDurations & {
  audioDurationSeconds: number;
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

const OUTPUT_BITRATE_KBPS = 192;
const MIN_FADE_SECONDS = 0.1;

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function validateFadeDurations(
  fadeInSeconds: number,
  fadeOutSeconds: number,
  audioDurationSeconds: number | null,
): string | null {
  if (!Number.isFinite(fadeInSeconds) || fadeInSeconds < MIN_FADE_SECONDS) {
    return `Fade-in duration must be at least ${MIN_FADE_SECONDS} seconds.`;
  }
  if (!Number.isFinite(fadeOutSeconds) || fadeOutSeconds < MIN_FADE_SECONDS) {
    return `Fade-out duration must be at least ${MIN_FADE_SECONDS} seconds.`;
  }
  if (!audioDurationSeconds || audioDurationSeconds <= 0) {
    return "Could not read audio duration. Try another MP3 or wait for metadata to load.";
  }

  if (fadeInSeconds >= audioDurationSeconds) {
    return `Fade-in (${fadeInSeconds.toFixed(1)}s) is longer than the track (${audioDurationSeconds.toFixed(1)}s). Shorten fade-in or use a longer file.`;
  }
  if (fadeOutSeconds >= audioDurationSeconds) {
    return `Fade-out (${fadeOutSeconds.toFixed(1)}s) is longer than the track (${audioDurationSeconds.toFixed(1)}s). Shorten fade-out or use a longer file.`;
  }
  if (fadeInSeconds + fadeOutSeconds > audioDurationSeconds) {
    return `Fade-in and fade-out together (${(fadeInSeconds + fadeOutSeconds).toFixed(1)}s) exceed track length (${audioDurationSeconds.toFixed(1)}s). Reduce one or both durations.`;
  }

  return null;
}

export function buildAfadeFilter(
  fadeInSeconds: number,
  fadeOutSeconds: number,
  audioDurationSeconds: number,
): string {
  const fadeOutStart = Math.max(0, audioDurationSeconds - fadeOutSeconds);
  const fadeIn = Number(fadeInSeconds.toFixed(3));
  const fadeOut = Number(fadeOutSeconds.toFixed(3));
  const start = Number(fadeOutStart.toFixed(3));

  return `afade=t=in:ss=0:d=${fadeIn},afade=t=out:st=${start}:d=${fadeOut}`;
}

export function buildApplyFadeArgs(
  inputName: string,
  outputName: string,
  fadeInSeconds: number,
  fadeOutSeconds: number,
  audioDurationSeconds: number,
): string[] {
  return [
    "-i",
    inputName,
    "-af",
    buildAfadeFilter(fadeInSeconds, fadeOutSeconds, audioDurationSeconds),
    "-codec:a",
    "libmp3lame",
    "-b:a",
    `${OUTPUT_BITRATE_KBPS}k`,
    outputName,
  ];
}

export async function applyFadeInOut(file: File, options: ApplyFadeOptions): Promise<Blob> {
  if (!isMp3File(file)) {
    throw new Error(
      "Invalid or unsupported file. Please upload a valid MP3 audio file for fade effects.",
    );
  }

  const validationError = validateFadeDurations(
    options.fadeInSeconds,
    options.fadeOutSeconds,
    options.audioDurationSeconds,
  );
  if (validationError) {
    throw new Error(validationError);
  }

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = "input.mp3";
  const outputName = "output.mp3";

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      await ffmpeg.exec(
        buildApplyFadeArgs(
          inputName,
          outputName,
          options.fadeInSeconds,
          options.fadeOutSeconds,
          options.audioDurationSeconds,
        ),
      );
      const outputBytes = await ffmpeg.readFile(outputName);
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      return new Blob([copy], { type: "audio/mpeg" });
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
      await ffmpeg.cleanupWorkspace();
    }
  } finally {
    progressUnsub?.();
  }
}

export function fadedOutputFileName(inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}-faded.mp3`;
}

export { MIN_FADE_SECONDS };
