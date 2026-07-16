import { mediaToolRegistry } from "./core/MediaToolRegistry";
import { AudioManager } from "./processors/AudioManager";
import { VideoManager } from "./processors/VideoManager";

/**
 * Local-first media processing layer.
 *
 * Architecture:
 * - Main thread: UI + FfmpegWorkerClient (wraps `@ffmpeg/ffmpeg`).
 * - `@ffmpeg/ffmpeg` owns a single Web Worker for core/WASM — do not nest another Dedicated Worker.
 * - Cleanup: `cleanupWorkspace()` purges virtual FS after every job.
 * - Performance: local `/static/ffmpeg` cores; `@ffmpeg/core-mt` when cross-origin isolated.
 */
export { BaseMediaProcessor } from "./core/BaseMediaProcessor";
export { MediaToolRegistry, mediaToolRegistry } from "./core/MediaToolRegistry";
export * from "./types";
export {
  FfmpegWorkerClient,
  FFMPEG_WORKER_SCRIPT_PATH,
} from "./workers/FfmpegWorkerClient";
export type { WorkerReadyMessage } from "./workers/FfmpegWorkerClient";
export {
  FFMPEG_CORE_VERSION,
  isCrossOriginIsolated,
  resolveFfmpegCoreBundle,
  wasmSimdSupported,
} from "./workers/ffmpeg-core-config";
export { AudioManager } from "./processors/AudioManager";
export { VideoManager } from "./processors/VideoManager";

let bootstrapped = false;

/** Register built-in audio/video managers. Safe to call multiple times. */
export function bootstrapMediaTools(): void {
  if (bootstrapped) return;
  const video = new VideoManager();
  const audio = new AudioManager();
  mediaToolRegistry.register(video);
  mediaToolRegistry.register(audio);
  bootstrapped = true;
}

export function getVideoManager(): VideoManager {
  bootstrapMediaTools();
  return mediaToolRegistry.get<VideoManager>("video-manager")!;
}

export function getAudioManager(): AudioManager {
  bootstrapMediaTools();
  return mediaToolRegistry.get<AudioManager>("audio-manager")!;
}
