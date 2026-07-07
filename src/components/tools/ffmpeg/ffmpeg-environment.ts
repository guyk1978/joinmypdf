import { isCrossOriginIsolated, wasmSimdSupported } from "@/services/media/workers/ffmpeg-core-config";

export type FfmpegEnvironmentStatus = {
  /** FFmpeg can run (WebAssembly available). */
  canRun: boolean;
  /** `core-mt` pthreads available — faster conversions. */
  multiThreaded: boolean;
  simd: boolean;
  /** User-facing message when `canRun` is false. */
  blockingMessage?: string;
  /** Non-blocking notice when running single-threaded core. */
  performanceNotice?: string;
};

export function getFfmpegEnvironmentStatus(): FfmpegEnvironmentStatus {
  if (typeof window === "undefined") {
    return { canRun: true, multiThreaded: false, simd: false };
  }

  if (typeof WebAssembly === "undefined") {
    return {
      canRun: false,
      multiThreaded: false,
      simd: false,
      blockingMessage:
        "This browser does not support WebAssembly, which is required for local audio conversion. Try a current version of Chrome, Firefox, Safari, or Edge.",
    };
  }

  const multiThreaded = isCrossOriginIsolated();
  const simd = wasmSimdSupported();

  return {
    canRun: true,
    multiThreaded,
    simd,
    performanceNotice: multiThreaded
      ? undefined
      : "Multi-threaded FFmpeg is unavailable (Cross-Origin Isolation headers missing). Conversion still runs locally in single-thread mode — it may take longer on large files.",
  };
}

export function formatFfmpegLoadError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes("sharedarraybuffer") || lower.includes("cross-origin")) {
    return "FFmpeg could not start because this page is not cross-origin isolated. Ensure Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers are set, then reload. Single-thread mode should still work after a refresh once headers are active.";
  }

  if (lower.includes("out of memory") || lower.includes("oom")) {
    return "The browser ran out of memory while loading FFmpeg. Close other tabs and try a smaller audio file.";
  }

  return raw || "Audio conversion failed.";
}
