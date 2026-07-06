import type { MediaKind, MediaProcessingError, MediaProgress } from "./media.types";

export interface IMediaTool<TResult = Blob> {
  readonly toolId: string;
  readonly mediaKind: MediaKind;

  processFile(file: File, options?: Record<string, unknown>): Promise<TResult>;

  /** Subscribe to progress updates. Returns an unsubscribe function. */
  onProgress(callback: (progress: MediaProgress) => void): () => void;

  handleError(error: unknown): MediaProcessingError;
}
