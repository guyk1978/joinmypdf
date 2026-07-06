import { BaseMediaProcessor } from "../core/BaseMediaProcessor";
import {
  buildAudioCompressArgs,
  buildConvertArgs,
  buildExtractAudioArgs,
  inputFileName,
  outputFileName,
} from "../core/ffmpeg-commands";
import {
  extensionFromFile,
  mimeFromExtension,
  type AudioCompressOptions,
  type AudioConvertOptions,
  type AudioExtractOptions,
  type MediaMetadata,
} from "../types";

export class AudioManager extends BaseMediaProcessor<Blob> {
  readonly toolId = "audio-manager";
  readonly mediaKind = "audio" as const;

  async compress(file: File, options: AudioCompressOptions): Promise<Blob> {
    return this.processFile(file, { operation: "compress", ...options });
  }

  async convertFormat(file: File, options: AudioConvertOptions): Promise<Blob> {
    return this.processFile(file, { operation: "convert", ...options });
  }

  async extractAudio(videoFile: File, options: AudioExtractOptions = {}): Promise<Blob> {
    return this.processFile(videoFile, { operation: "extract", ...options });
  }

  async getMetadata(file: File): Promise<MediaMetadata> {
    const url = URL.createObjectURL(file);
    try {
      const audio = document.createElement("audio");
      audio.preload = "metadata";

      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => resolve();
        audio.onerror = () => reject(new Error("Could not read audio metadata."));
        audio.src = url;
      });

      return {
        durationSeconds: Number.isFinite(audio.duration) ? audio.duration : 0,
        format: extensionFromFile(file),
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  protected async runProcessing(file: File, options: Record<string, unknown>): Promise<Blob> {
    const operation = String(options.operation ?? "convert");
    const inputName = inputFileName(file);

    if (operation === "compress") {
      const bitrateKbps = Number(options.bitrateKbps ?? 128);
      const outputFormat = String(options.outputFormat ?? extensionFromFile(file));
      const outName = outputFileName(file, outputFormat, "compressed");
      const args = buildAudioCompressArgs(inputName, outName, bitrateKbps);
      const bytes = await this.executeFfmpeg(file, inputName, outName, args);
      return this.toBlob(bytes, mimeFromExtension(outputFormat));
    }

    if (operation === "extract") {
      const outputFormat = String(options.outputFormat ?? "m4a");
      const outName = outputFileName(file, outputFormat, "audio");
      const args = buildExtractAudioArgs(inputName, outName);
      const bytes = await this.executeFfmpeg(file, inputName, outName, args);
      return this.toBlob(bytes, mimeFromExtension(outputFormat));
    }

    const outputFormat = String(options.outputFormat ?? "mp3");
    const outName = outputFileName(file, outputFormat, "converted");
    const args = buildConvertArgs(inputName, outName);
    const bytes = await this.executeFfmpeg(file, inputName, outName, args);
    return this.toBlob(bytes, mimeFromExtension(outputFormat));
  }
}
