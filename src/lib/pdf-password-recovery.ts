import type { WorkerCharsetOptions, WorkerStartPayload } from "@/workers/pdf-password-recovery.worker";

export type CharsetOptions = WorkerCharsetOptions;

export type RecoveryProgress = {
  tried: number;
  total: number;
};

export type RecoveryResult =
  | { status: "found"; password: string; tried: number; total: number }
  | { status: "not-found"; tried: number; total: number }
  | { status: "limit"; tried: number; total: number }
  | { status: "error"; message: string };

export const MAX_RECOVERY_ATTEMPTS = 2_000_000;
export const MAX_PASSWORD_LENGTH = 8;

export const DEFAULT_CHARSET: CharsetOptions = {
  lowercase: true,
  uppercase: false,
  digits: true,
  special: false,
  custom: "",
};

export function buildCharsetString(options: CharsetOptions): string {
  let charset = "";
  if (options.lowercase) charset += "abcdefghijklmnopqrstuvwxyz";
  if (options.uppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.digits) charset += "0123456789";
  if (options.special) charset += "!@#$%^&*()-_=+[]{}|;:',.<>?/`~";
  charset += options.custom || "";
  return [...new Set(charset.split(""))].join("");
}

const COMMON_COUNT = 28;

export function estimateRecoveryAttempts(
  options: CharsetOptions,
  minLength: number,
  maxLength: number,
  tryCommon: boolean,
): number {
  const charset = buildCharsetString(options);
  const size = charset.length;
  let total = 0;
  for (let len = Math.max(1, minLength); len <= maxLength; len += 1) {
    if (size > 0) total += Math.pow(size, len);
  }
  if (tryCommon) total += COMMON_COUNT;
  return Math.min(total, MAX_RECOVERY_ATTEMPTS);
}

export function formatAttemptCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export type RecoverySession = {
  cancel: () => void;
};

export function startPasswordRecovery(
  pdfBytes: ArrayBuffer,
  config: {
    charset: CharsetOptions;
    minLength: number;
    maxLength: number;
    tryCommon: boolean;
  },
  handlers: {
    onProgress: (progress: RecoveryProgress) => void;
    onComplete: (result: RecoveryResult) => void;
  },
): RecoverySession {
  const worker = new Worker(new URL("../workers/pdf-password-recovery.worker.ts", import.meta.url), {
    type: "module",
  });

  const payload: WorkerStartPayload = {
    type: "start",
    pdfBytes,
    charset: config.charset,
    minLength: config.minLength,
    maxLength: config.maxLength,
    tryCommon: config.tryCommon,
    maxAttempts: MAX_RECOVERY_ATTEMPTS,
  };

  worker.onmessage = (event: MessageEvent) => {
    const data = event.data as Record<string, unknown>;
    if (data.type === "progress") {
      handlers.onProgress({
        tried: Number(data.tried) || 0,
        total: Number(data.total) || 0,
      });
      return;
    }
    if (data.type === "found") {
      worker.terminate();
      handlers.onComplete({
        status: "found",
        password: String(data.password ?? ""),
        tried: Number(data.tried) || 0,
        total: Number(data.total) || 0,
      });
      return;
    }
    if (data.type === "not-found") {
      worker.terminate();
      handlers.onComplete({
        status: "not-found",
        tried: Number(data.tried) || 0,
        total: Number(data.total) || 0,
      });
      return;
    }
    if (data.type === "limit") {
      worker.terminate();
      handlers.onComplete({
        status: "limit",
        tried: Number(data.tried) || 0,
        total: Number(data.total) || 0,
      });
      return;
    }
    if (data.type === "error") {
      worker.terminate();
      handlers.onComplete({
        status: "error",
        message: String(data.message || "Password recovery failed."),
      });
    }
  };

  worker.onerror = () => {
    worker.terminate();
    handlers.onComplete({ status: "error", message: "The recovery worker stopped unexpectedly." });
  };

  worker.postMessage(payload, [pdfBytes]);

  return {
    cancel: () => {
      worker.postMessage({ type: "cancel" });
      worker.terminate();
    },
  };
}

export function recoveryOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-unlocked.pdf`;
}
