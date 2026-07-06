/// <reference lib="webworker" />
/**
 * Dedicated application Web Worker for all ffmpeg.wasm work.
 * The main thread never imports @ffmpeg/ffmpeg — only postMessage via FfmpegWorkerClient.
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import {
  resolveFfmpegCoreBundle,
  resolveFfmpegCorePaths,
  wasmSimdSupported,
} from "./ffmpeg-core-config";

type WorkerRequest =
  | { id: string; type: "load" }
  | { id: string; type: "writeFile"; name: string; data: Uint8Array }
  | { id: string; type: "readFile"; name: string }
  | { id: string; type: "deleteFile"; name: string }
  | { id: string; type: "exec"; args: string[] }
  | { id: string; type: "cleanupFs" };

type WorkerSuccess =
  | { id: string; type: "success" }
  | { id: string; type: "success"; data: Uint8Array };

type WorkerError = { id: string; type: "error"; message: string };

type WorkerProgress = { type: "progress"; ratio: number };

type WorkerReady = {
  type: "ready";
  runsInWorker: true;
  bundle: string;
  simd: boolean;
};

const ffmpeg = new FFmpeg();
let loaded = false;
const trackedFiles = new Set<string>();
const RESERVED_ENTRIES = new Set([".", ".."]);

function trackFile(name: string): void {
  if (name && !RESERVED_ENTRIES.has(name)) {
    trackedFiles.add(name);
  }
}

function untrackFile(name: string): void {
  trackedFiles.delete(name);
}

async function cleanupVirtualFs(): Promise<void> {
  const deleteOne = async (name: string) => {
    try {
      await ffmpeg.deleteFile(name);
    } catch {
      // Already removed or never existed.
    } finally {
      untrackFile(name);
    }
  };

  const listed: string[] = [];
  try {
    const entries = await ffmpeg.listDir("/");
    for (const entry of entries) {
      if (!entry.isDir && !RESERVED_ENTRIES.has(entry.name)) {
        listed.push(entry.name);
      }
    }
  } catch {
    // FS not ready — fall back to tracked set only.
  }

  const toDelete = new Set<string>([...trackedFiles, ...listed]);
  await Promise.all([...toDelete].map((name) => deleteOne(name)));
}

async function ensureFfmpegLoaded(): Promise<void> {
  if (loaded) return;

  const bundle = resolveFfmpegCoreBundle();
  const paths = resolveFfmpegCorePaths(bundle);

  const loadConfig: {
    coreURL: string;
    wasmURL: string;
    workerURL?: string;
  } = {
    coreURL: await toBlobURL(paths.corePath, "text/javascript"),
    wasmURL: await toBlobURL(paths.wasmPath, "application/wasm"),
  };

  if (paths.workerPath) {
    loadConfig.workerURL = await toBlobURL(paths.workerPath, "text/javascript");
  }

  await ffmpeg.load(loadConfig);

  ffmpeg.on("progress", ({ progress }) => {
    const ratio = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
    self.postMessage({ type: "progress", ratio } satisfies WorkerProgress);
  });

  loaded = true;

  self.postMessage({
    type: "ready",
    runsInWorker: true,
    bundle,
    simd: wasmSimdSupported(),
  } satisfies WorkerReady);
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  try {
    if (message.type === "load") {
      await ensureFfmpegLoaded();
      self.postMessage({ id: message.id, type: "success" } satisfies WorkerSuccess);
      return;
    }

    await ensureFfmpegLoaded();

    if (message.type === "writeFile") {
      await ffmpeg.writeFile(message.name, message.data);
      trackFile(message.name);
      self.postMessage({ id: message.id, type: "success" } satisfies WorkerSuccess);
      return;
    }

    if (message.type === "deleteFile") {
      await ffmpeg.deleteFile(message.name);
      untrackFile(message.name);
      self.postMessage({ id: message.id, type: "success" } satisfies WorkerSuccess);
      return;
    }

    if (message.type === "cleanupFs") {
      await cleanupVirtualFs();
      self.postMessage({ id: message.id, type: "success" } satisfies WorkerSuccess);
      return;
    }

    if (message.type === "exec") {
      await ffmpeg.exec(message.args);
      self.postMessage({ id: message.id, type: "success" } satisfies WorkerSuccess);
      return;
    }

    if (message.type === "readFile") {
      const data = (await ffmpeg.readFile(message.name)) as Uint8Array;
      self.postMessage({ id: message.id, type: "success", data } satisfies WorkerSuccess);
      return;
    }

    const unknownType = (message as { type: string }).type;
    self.postMessage({
      id: (message as WorkerRequest).id,
      type: "error",
      message: `Unknown worker request: ${unknownType}`,
    } satisfies WorkerError);
  } catch (error) {
    await cleanupVirtualFs().catch(() => undefined);
    self.postMessage({
      id: message.id,
      type: "error",
      message: error instanceof Error ? error.message : "FFmpeg worker failed.",
    } satisfies WorkerError);
  }
};
