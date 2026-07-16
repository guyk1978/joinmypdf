import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import {
  resolveFfmpegCoreBundle,
  resolveFfmpegCorePaths,
  wasmSimdSupported,
  type FfmpegCoreBundle,
} from "./ffmpeg-core-config";

export type WorkerReadyMessage = {
  type: "ready";
  runsInWorker: true;
  bundle: string;
  simd: boolean;
};

let clientInstance: FfmpegWorkerClient | null = null;

const RESERVED_ENTRIES = new Set([".", ".."]);

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string" && error.trim()) return new Error(error);
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message || "").trim();
    if (message) return new Error(message);
  }
  return new Error(String(error || "FFmpeg worker failed."));
}

/**
 * Absolute same-origin path for `@ffmpeg/ffmpeg`'s class Worker.
 * Synced to `public/workers/ffmpeg-worker.js` by scripts/sync-public-assets.mjs.
 * Always absolute (leading `/`) so locale / nested tool routes cannot resolve a relative worker URL.
 */
export const FFMPEG_WORKER_SCRIPT_PATH = "/workers/ffmpeg-worker.js";

function resolveClassWorkerUrl(): string {
  if (typeof window === "undefined") {
    return FFMPEG_WORKER_SCRIPT_PATH;
  }
  return new URL(FFMPEG_WORKER_SCRIPT_PATH, window.location.origin).href;
}

/**
 * Main-thread façade for ffmpeg.wasm.
 *
 * Uses `@ffmpeg/ffmpeg` (one internal Worker) with an explicit same-origin
 * `classWorkerURL` so Worker construction never points at a cross-origin script.
 */
export class FfmpegWorkerClient {
  static getInstance(): FfmpegWorkerClient {
    if (!clientInstance) {
      clientInstance = new FfmpegWorkerClient();
    }
    return clientInstance;
  }

  private ffmpeg: FFmpeg | null = null;
  private loadPromise: Promise<WorkerReadyMessage> | null = null;
  private readyInfo: WorkerReadyMessage | null = null;
  private progressAttached = false;
  private readonly progressHandlers = new Set<(ratio: number) => void>();
  private readonly trackedFiles = new Set<string>();

  getWorkerDiagnostics(): WorkerReadyMessage | null {
    return this.readyInfo;
  }

  reset(): void {
    if (this.ffmpeg) {
      try {
        this.ffmpeg.terminate();
      } catch {
        // ignore
      }
      this.ffmpeg = null;
    }
    this.loadPromise = null;
    this.readyInfo = null;
    this.progressAttached = false;
    this.trackedFiles.clear();
  }

  onProgress(callback: (ratio: number) => void): () => void {
    this.progressHandlers.add(callback);
    return () => this.progressHandlers.delete(callback);
  }

  private getFfmpeg(): FFmpeg {
    if (!this.ffmpeg) {
      this.ffmpeg = new FFmpeg();
    }
    return this.ffmpeg;
  }

  private attachProgress(ffmpeg: FFmpeg): void {
    if (this.progressAttached) return;
    this.progressAttached = true;
    ffmpeg.on("progress", ({ progress }) => {
      const ratio = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
      for (const handler of this.progressHandlers) {
        handler(ratio);
      }
    });
  }

  private async loadBundle(bundle: FfmpegCoreBundle, source: "local" | "cdn"): Promise<void> {
    const ffmpeg = this.getFfmpeg();
    const paths = resolveFfmpegCorePaths(bundle, source);

    const coreURL = await toBlobURL(paths.corePath, "text/javascript");
    const wasmURL = await toBlobURL(paths.wasmPath, "application/wasm");
    const workerURL = paths.workerPath
      ? await toBlobURL(paths.workerPath, "text/javascript")
      : undefined;

    const classWorkerURL = resolveClassWorkerUrl();

    await ffmpeg.load({
      coreURL,
      wasmURL,
      workerURL,
      classWorkerURL,
    });

    this.attachProgress(ffmpeg);
    this.readyInfo = {
      type: "ready",
      runsInWorker: true,
      bundle,
      simd: wasmSimdSupported(),
    };
  }

  private async loadWithFallback(): Promise<WorkerReadyMessage> {
    // Prefer single-thread local core first (most reliable under COEP).
    // Optionally try multi-thread after, then CDN as last resort.
    const preferred = resolveFfmpegCoreBundle();
    const attempts: Array<{ bundle: FfmpegCoreBundle; source: "local" | "cdn" }> = [
      { bundle: "core", source: "local" },
    ];
    if (preferred === "core-mt") {
      attempts.push({ bundle: "core-mt", source: "local" });
    }
    attempts.push({ bundle: "core", source: "cdn" });

    const errors: string[] = [];

    for (const attempt of attempts) {
      try {
        this.reset();
        await this.loadBundle(attempt.bundle, attempt.source);
        if (!this.readyInfo) {
          throw new Error("FFmpeg reported success without ready state.");
        }
        return this.readyInfo;
      } catch (cause) {
        errors.push(`${attempt.source}/${attempt.bundle}: ${toError(cause).message}`);
      }
    }

    throw new Error(
      `FFmpeg engine failed to load (${errors.join(" · ") || "unknown error"}). Check the worker script and try Reload FFmpeg engine.`,
    );
  }

  async ensureLoaded(): Promise<WorkerReadyMessage> {
    if (typeof window === "undefined") {
      throw new Error("FFmpeg is only available in the browser.");
    }

    if (this.readyInfo && this.ffmpeg?.loaded) {
      return this.readyInfo;
    }

    if (!this.loadPromise) {
      this.loadPromise = this.loadWithFallback().catch((error) => {
        this.loadPromise = null;
        throw toError(error);
      });
    }

    return this.loadPromise;
  }

  async writeFile(name: string, data: Uint8Array): Promise<void> {
    await this.ensureLoaded();
    await this.getFfmpeg().writeFile(name, data);
    if (name && !RESERVED_ENTRIES.has(name)) {
      this.trackedFiles.add(name);
    }
  }

  async readFile(name: string): Promise<Uint8Array> {
    await this.ensureLoaded();
    const data = await this.getFfmpeg().readFile(name);
    if (!(data instanceof Uint8Array)) {
      throw new Error(`FFmpeg did not return binary output for ${name}.`);
    }
    return data;
  }

  async deleteFile(name: string): Promise<void> {
    await this.ensureLoaded();
    try {
      await this.getFfmpeg().deleteFile(name);
    } finally {
      this.trackedFiles.delete(name);
    }
  }

  async exec(args: string[]): Promise<void> {
    await this.ensureLoaded();
    await this.getFfmpeg().exec(args);
  }

  async cleanupWorkspace(): Promise<void> {
    if (!this.ffmpeg?.loaded) {
      this.trackedFiles.clear();
      return;
    }

    const ffmpeg = this.ffmpeg;
    const listed: string[] = [];
    try {
      const entries = await ffmpeg.listDir("/");
      for (const entry of entries) {
        if (!entry.isDir && !RESERVED_ENTRIES.has(entry.name)) {
          listed.push(entry.name);
        }
      }
    } catch {
      // FS not ready
    }

    const toDelete = new Set<string>([...this.trackedFiles, ...listed]);
    await Promise.all(
      [...toDelete].map(async (name) => {
        try {
          await ffmpeg.deleteFile(name);
        } catch {
          // Already removed.
        } finally {
          this.trackedFiles.delete(name);
        }
      }),
    );
  }
}
