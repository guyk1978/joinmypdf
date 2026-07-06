import {
  buildConvertArgs,
  buildTrimArgs,
  buildVideoToMp4CopyArgs,
  buildVideoToMp4EncodeArgs,
  inputFileName,
  outputFileName,
} from "../core/ffmpeg-commands";
import { BaseMediaProcessor } from "../core/BaseMediaProcessor";
import {
  extensionFromFile,
  mimeFromExtension,
  VIDEO_TO_MP4_DEFAULT_CRF,
  type MediaMetadata,
  resolveVideoCompressCrf,
  type VideoCompressOptions,
  type VideoConvertOptions,
  type VideoToMp4Options,
  type VideoTrimOptions,
} from "../types";

export class VideoManager extends BaseMediaProcessor<Blob> {
  readonly toolId = "video-manager";
  readonly mediaKind = "video" as const;

  async trim(file: File, options: VideoTrimOptions): Promise<Blob> {
    return this.processFile(file, { operation: "trim", ...options });
  }

  async convert(file: File, options: VideoConvertOptions): Promise<Blob> {
    return this.processFile(file, { operation: "convert", ...options });
  }

  async toMp4(file: File, options: VideoToMp4Options = {}): Promise<Blob> {
    return this.processFile(file, { operation: "to-mp4", ...options });
  }

  async compress(file: File, options: VideoCompressOptions = {}): Promise<Blob> {
    return this.processFile(file, { operation: "compress", ...options });
  }

  async getMetadata(file: File): Promise<MediaMetadata> {
    const url = URL.createObjectURL(file);
    try {
      const video = document.createElement("video");
      video.preload = "metadata";

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Could not read video metadata."));
        video.src = url;
      });

      return {
        durationSeconds: Number.isFinite(video.duration) ? video.duration : 0,
        format: extensionFromFile(file),
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  protected async runProcessing(file: File, options: Record<string, unknown>): Promise<Blob> {
    const operation = String(options.operation ?? "convert");

    if (operation === "trim") {
      const startSeconds = Number(options.startSeconds ?? 0);
      const endSeconds = Number(options.endSeconds ?? 0);
      const outputFormat = String(options.outputFormat ?? extensionFromFile(file));

      if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds) || endSeconds <= startSeconds) {
        throw new Error("Invalid trim range. End time must be after start time.");
      }

      const inputName = inputFileName(file);
      const outName = outputFileName(file, outputFormat, "trimmed");
      const args = buildTrimArgs(inputName, outName, startSeconds, endSeconds);
      const bytes = await this.executeFfmpeg(file, inputName, outName, args);
      return this.toBlob(bytes, mimeFromExtension(outputFormat));
    }

    if (operation === "compress") {
      const crf = resolveVideoCompressCrf(options as VideoCompressOptions);
      const inputName = inputFileName(file);
      const outName = outputFileName(file, "mp4", "compressed");
      const args = buildVideoToMp4EncodeArgs(inputName, outName, crf);
      const bytes = await this.executeFfmpeg(file, inputName, outName, args);
      return this.toBlob(bytes, "video/mp4");
    }

    if (operation === "to-mp4") {
      const preferCopy = options.preferCopy !== false;
      const crf = Number(options.crf ?? VIDEO_TO_MP4_DEFAULT_CRF);
      const inputName = inputFileName(file);
      const outName = outputFileName(file, "mp4", "converted");
      const ext = extensionFromFile(file);
      const copyArgs = buildVideoToMp4CopyArgs(inputName, outName);
      const encodeArgs = buildVideoToMp4EncodeArgs(inputName, outName, crf);

      const bytes =
        preferCopy && (ext === "mp4" || ext === "m4v")
          ? await this.executeFfmpegWithFallback(file, inputName, outName, copyArgs, encodeArgs)
          : await this.executeFfmpeg(file, inputName, outName, encodeArgs);

      return this.toBlob(bytes, "video/mp4");
    }

    const outputFormat = String(options.outputFormat ?? "mp4");
    const inputName = inputFileName(file);
    const outName = outputFileName(file, outputFormat, "converted");
    const args = buildConvertArgs(inputName, outName);
    const bytes = await this.executeFfmpeg(file, inputName, outName, args);
    return this.toBlob(bytes, mimeFromExtension(outputFormat));
  }
}
