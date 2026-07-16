import { isCrossOriginIsolated, wasmSimdSupported } from "@/services/media/workers/ffmpeg-core-config";
import {
  FfmpegWorkerClient,
  FFMPEG_WORKER_SCRIPT_PATH,
} from "@/services/media/workers/FfmpegWorkerClient";

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

  // Preserve detailed multi-attempt diagnostics when present.
  if (raw.startsWith("FFmpeg engine failed to load (")) {
    return `${raw} Use “Reload FFmpeg engine”, then try again.`;
  }

  if (lower.includes("content security policy") || lower.includes("csp") || lower.includes("violates the following content security policy")) {
    return `FFmpeg worker was blocked by Content Security Policy. worker-src must allow 'self' and blob: (script path ${FFMPEG_WORKER_SCRIPT_PATH}).`;
  }

  if (lower.includes("cannot be accessed from origin") || lower.includes("failed to construct 'worker'")) {
    return "FFmpeg worker script was blocked (cross-origin Worker). Hard-refresh the page so the same-origin worker bundle loads, then try again.";
  }

  if (lower.includes("sharedarraybuffer") || lower.includes("cross-origin isolation")) {
    return "FFmpeg could not start because this page is not cross-origin isolated. Ensure COOP/COEP headers are set, then reload.";
  }

  if (lower.includes("out of memory") || lower.includes("oom")) {
    return "The browser ran out of memory while loading FFmpeg. Close other tabs and try a smaller audio file.";
  }

  if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("load failed")) {
    return "Could not download the FFmpeg engine files. Check your connection, then use “Reload FFmpeg engine”.";
  }

  if (lower.includes("failed to import ffmpeg-core") || lower.includes("worker failed")) {
    return `${raw} Use “Reload FFmpeg engine”, then try again.`;
  }

  return raw || "Audio conversion failed.";
}

/** Hard-reset the singleton worker so the next job can recover from a bad load. */
export function resetFfmpegEngine(): void {
  if (typeof window === "undefined") return;
  FfmpegWorkerClient.getInstance().reset();
}
