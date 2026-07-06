import { FfmpegWorkerClient } from "../workers/FfmpegWorkerClient";
import type { IMediaTool } from "../types/IMediaTool";
import { MediaProcessingError, type MediaKind, type MediaProgress } from "../types/media.types";

export abstract class BaseMediaProcessor<TResult = Blob> implements IMediaTool<TResult> {
  abstract readonly toolId: string;
  abstract readonly mediaKind: MediaKind;

  private readonly progressListeners = new Set<(progress: MediaProgress) => void>();
  private ffmpegProgressUnsub: (() => void) | null = null;

  protected readonly ffmpeg = FfmpegWorkerClient.getInstance();

  onProgress(callback: (progress: MediaProgress) => void): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }

  handleError(error: unknown): MediaProcessingError {
    if (error instanceof MediaProcessingError) return error;
    const message = error instanceof Error ? error.message : "Media processing failed.";
    return new MediaProcessingError(message, "MEDIA_PROCESSING_FAILED", error);
  }

  async processFile(file: File, options?: Record<string, unknown>): Promise<TResult> {
    this.bindFfmpegProgress();

    try {
      this.emitProgress({ phase: "loading", ratio: 0, message: "Loading FFmpeg engine…" });
      await this.ffmpeg.ensureLoaded();

      this.emitProgress({ phase: "processing", ratio: 0, message: "Processing media…" });
      const result = await this.runProcessing(file, options ?? {});

      this.emitProgress({ phase: "success", ratio: 1, message: "Done." });
      return result;
    } catch (error) {
      const normalized = this.handleError(error);
      this.emitProgress({ phase: "error", ratio: 0, message: normalized.message });
      throw normalized;
    } finally {
      this.unbindFfmpegProgress();
    }
  }

  protected abstract runProcessing(
    file: File,
    options: Record<string, unknown>,
  ): Promise<TResult>;

  protected emitProgress(progress: MediaProgress): void {
    for (const listener of this.progressListeners) {
      listener(progress);
    }
  }

  protected async executeFfmpeg(
    file: File,
    inputName: string,
    outputName: string,
    args: string[],
  ): Promise<Uint8Array> {
    const inputBytes = new Uint8Array(await file.arrayBuffer());
    await this.ffmpeg.writeFile(inputName, inputBytes);

    try {
      await this.ffmpeg.exec(args);
      return await this.ffmpeg.readFile(outputName);
    } finally {
      await this.ffmpeg.deleteFile(inputName).catch(() => undefined);
      await this.ffmpeg.deleteFile(outputName).catch(() => undefined);
      await this.ffmpeg.cleanupWorkspace();
    }
  }

  protected async executeFfmpegWithFallback(
    file: File,
    inputName: string,
    outputName: string,
    primaryArgs: string[],
    fallbackArgs: string[],
  ): Promise<Uint8Array> {
    const inputBytes = new Uint8Array(await file.arrayBuffer());
    await this.ffmpeg.writeFile(inputName, inputBytes);

    try {
      try {
        await this.ffmpeg.exec(primaryArgs);
      } catch {
        await this.ffmpeg.exec(fallbackArgs);
      }
      return await this.ffmpeg.readFile(outputName);
    } finally {
      await this.ffmpeg.deleteFile(inputName).catch(() => undefined);
      await this.ffmpeg.deleteFile(outputName).catch(() => undefined);
      await this.ffmpeg.cleanupWorkspace();
    }
  }

  protected toBlob(data: Uint8Array, mimeType: string): Blob {
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    return new Blob([copy], { type: mimeType });
  }

  private bindFfmpegProgress(): void {
    this.unbindFfmpegProgress();
    this.ffmpegProgressUnsub = this.ffmpeg.onProgress((ratio) => {
      this.emitProgress({
        phase: "processing",
        ratio,
        message: "Processing media…",
      });
    });
  }

  private unbindFfmpegProgress(): void {
    this.ffmpegProgressUnsub?.();
    this.ffmpegProgressUnsub = null;
  }
}
