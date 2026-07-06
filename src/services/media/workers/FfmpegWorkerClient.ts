type WorkerRequest =
  | { id: string; type: "load" }
  | { id: string; type: "writeFile"; name: string; data: Uint8Array }
  | { id: string; type: "readFile"; name: string }
  | { id: string; type: "deleteFile"; name: string }
  | { id: string; type: "exec"; args: string[] }
  | { id: string; type: "cleanupFs" };

type WorkerRequestPayload =
  | { type: "load" }
  | { type: "writeFile"; name: string; data: Uint8Array }
  | { type: "readFile"; name: string }
  | { type: "deleteFile"; name: string }
  | { type: "exec"; args: string[] }
  | { type: "cleanupFs" };

type WorkerSuccess =
  | { id: string; type: "success" }
  | { id: string; type: "success"; data: Uint8Array };

type WorkerError = { id: string; type: "error"; message: string };

type WorkerProgress = { type: "progress"; ratio: number };

export type WorkerReadyMessage = {
  type: "ready";
  runsInWorker: true;
  bundle: string;
  simd: boolean;
};

export type WorkerOutboundMessage = WorkerSuccess | WorkerError | WorkerProgress | WorkerReadyMessage;

let clientInstance: FfmpegWorkerClient | null = null;

function createRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ffmpeg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Main-thread façade for ffmpeg.wasm.
 * All FFmpeg APIs execute inside `ffmpeg.worker.ts` — never on the UI thread.
 */
export class FfmpegWorkerClient {
  static getInstance(): FfmpegWorkerClient {
    if (!clientInstance) {
      clientInstance = new FfmpegWorkerClient();
    }
    return clientInstance;
  }

  private worker: Worker | null = null;
  private loadPromise: Promise<WorkerReadyMessage> | null = null;
  private readonly pending = new Map<
    string,
    { resolve: (value: Uint8Array | void) => void; reject: (error: Error) => void }
  >();
  private readonly progressHandlers = new Set<(ratio: number) => void>();
  private readyInfo: WorkerReadyMessage | null = null;

  /** Confirms the dedicated worker booted (dev-friendly diagnostics). */
  getWorkerDiagnostics(): WorkerReadyMessage | null {
    return this.readyInfo;
  }

  private getWorker(): Worker {
    if (typeof window === "undefined") {
      throw new Error("FFmpeg worker is only available in the browser.");
    }
    if (!this.worker) {
      this.worker = new Worker(new URL("./ffmpeg.worker.ts", import.meta.url), { type: "module" });
      this.worker.onmessage = (event: MessageEvent<WorkerOutboundMessage>) => {
        this.handleMessage(event.data);
      };
      this.worker.onerror = (event) => {
        const error = new Error(event.message || "FFmpeg worker crashed.");
        for (const [, pending] of this.pending) {
          pending.reject(error);
        }
        this.pending.clear();
      };
    }
    return this.worker;
  }

  onProgress(callback: (ratio: number) => void): () => void {
    this.progressHandlers.add(callback);
    return () => this.progressHandlers.delete(callback);
  }

  async ensureLoaded(): Promise<WorkerReadyMessage> {
    if (!this.loadPromise) {
      this.loadPromise = this.post<void>({ type: "load" }).then(() => {
        return (
          this.readyInfo ?? {
            type: "ready",
            runsInWorker: true,
            bundle: "core",
            simd: false,
          }
        );
      });
    }
    await this.loadPromise;
    return (
      this.readyInfo ?? {
        type: "ready",
        runsInWorker: true,
        bundle: "core",
        simd: false,
      }
    );
  }

  async writeFile(name: string, data: Uint8Array): Promise<void> {
    await this.post<void>({ type: "writeFile", name, data });
  }

  async readFile(name: string): Promise<Uint8Array> {
    const data = await this.post<Uint8Array>({ type: "readFile", name });
    if (!data) {
      throw new Error(`FFmpeg did not return output for ${name}.`);
    }
    return data;
  }

  async deleteFile(name: string): Promise<void> {
    await this.post<void>({ type: "deleteFile", name });
  }

  async exec(args: string[]): Promise<void> {
    await this.post<void>({ type: "exec", args });
  }

  /** Purge temporary files from the worker-side MEMFS after each job. */
  async cleanupWorkspace(): Promise<void> {
    if (!this.worker) return;
    await this.post<void>({ type: "cleanupFs" });
  }

  private post<T extends Uint8Array | void>(payload: WorkerRequestPayload): Promise<T> {
    const id = createRequestId();
    const worker = this.getWorker();
    const message = { id, ...payload } as WorkerRequest;

    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as (value: Uint8Array | void) => void,
        reject,
      });
      worker.postMessage(message);
    });
  }

  private handleMessage(message: WorkerOutboundMessage): void {
    if (message.type === "ready") {
      this.readyInfo = message;
      return;
    }

    if (message.type === "progress") {
      for (const handler of this.progressHandlers) {
        handler(message.ratio);
      }
      return;
    }

    const pending = this.pending.get(message.id);
    if (!pending) return;

    this.pending.delete(message.id);

    if (message.type === "error") {
      pending.reject(new Error(message.message));
      return;
    }

    pending.resolve("data" in message ? message.data : undefined);
  }
}
