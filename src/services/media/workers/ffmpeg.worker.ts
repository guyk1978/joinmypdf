/**
 * @deprecated Kept only for bundle/debug footprints.
 * Runtime FFmpeg work runs via `FfmpegWorkerClient` on the main thread,
 * which uses `@ffmpeg/ffmpeg`'s built-in Worker (avoid nested Workers).
 */
export {};
