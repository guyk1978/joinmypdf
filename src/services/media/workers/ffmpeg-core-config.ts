/** @ffmpeg/core version pinned to match @ffmpeg/ffmpeg 0.12.x */
export const FFMPEG_CORE_VERSION = "0.12.10";

/** Same-origin static paths (synced from node_modules by scripts/sync-public-assets.mjs). */
const LOCAL_CORE_BASE = "/static/ffmpeg/core";
const LOCAL_CORE_MT_BASE = "/static/ffmpeg/core-mt";

/** CDN fallback only if local assets are unavailable (often blocked under COEP). */
const CDN_CORE_BASE = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;
const CDN_CORE_MT_BASE = `https://unpkg.com/@ffmpeg/core-mt@${FFMPEG_CORE_VERSION}/dist/esm`;

/**
 * WebAssembly SIMD probe (i32x4.dot_i16x8_s).
 * Modern @ffmpeg/core builds benefit from SIMD-capable browsers automatically.
 */
export function wasmSimdSupported(): boolean {
  if (typeof WebAssembly === "undefined" || typeof WebAssembly.validate !== "function") {
    return false;
  }
  try {
    return WebAssembly.validate(
      new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253,
        15, 253, 98, 11,
      ]),
    );
  } catch {
    return false;
  }
}

export function isCrossOriginIsolated(): boolean {
  return typeof crossOriginIsolated === "boolean" && crossOriginIsolated;
}

export type FfmpegCoreBundle = "core" | "core-mt";

export function resolveFfmpegCoreBundle(): FfmpegCoreBundle {
  // core-mt uses SharedArrayBuffer + pthreads — only when the page is cross-origin isolated.
  return isCrossOriginIsolated() ? "core-mt" : "core";
}

function absoluteAssetUrl(pathname: string): string {
  if (typeof self !== "undefined" && self.location?.origin) {
    return new URL(pathname, self.location.origin).href;
  }
  return pathname;
}

export function resolveFfmpegCoreBase(
  bundle: FfmpegCoreBundle = resolveFfmpegCoreBundle(),
  source: "local" | "cdn" = "local",
): string {
  if (source === "cdn") {
    return bundle === "core-mt" ? CDN_CORE_MT_BASE : CDN_CORE_BASE;
  }
  return bundle === "core-mt" ? LOCAL_CORE_MT_BASE : LOCAL_CORE_BASE;
}

export type FfmpegCoreUrls = {
  bundle: FfmpegCoreBundle;
  simd: boolean;
  coreURL: string;
  wasmURL: string;
  workerURL?: string;
};

export function resolveFfmpegCorePaths(
  bundle: FfmpegCoreBundle = resolveFfmpegCoreBundle(),
  source: "local" | "cdn" = "local",
): Omit<FfmpegCoreUrls, "coreURL" | "wasmURL"> & {
  corePath: string;
  wasmPath: string;
  workerPath?: string;
} {
  const base = resolveFfmpegCoreBase(bundle, source);
  const toPath = (file: string) =>
    source === "local" ? absoluteAssetUrl(`${base}/${file}`) : `${base}/${file}`;

  return {
    bundle,
    simd: wasmSimdSupported(),
    corePath: toPath("ffmpeg-core.js"),
    wasmPath: toPath("ffmpeg-core.wasm"),
    workerPath: bundle === "core-mt" ? toPath("ffmpeg-core.worker.js") : undefined,
  };
}
