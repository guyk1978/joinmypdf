/// <reference lib="webworker" />
import { EncryptedPDFError, PDFDocument } from "pdf-lib-with-encrypt";

export type WorkerCharsetOptions = {
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  special: boolean;
  custom: string;
};

export type WorkerStartPayload = {
  type: "start";
  pdfBytes: ArrayBuffer;
  charset: WorkerCharsetOptions;
  minLength: number;
  maxLength: number;
  tryCommon: boolean;
  maxAttempts: number;
};

const COMMON_PASSWORDS = [
  "",
  "1",
  "12",
  "123",
  "1234",
  "12345",
  "123456",
  "1234567",
  "12345678",
  "password",
  "Password",
  "password1",
  "Password1",
  "admin",
  "qwerty",
  "abc123",
  "letmein",
  "welcome",
  "pdf",
  "test",
  "0000",
  "1111",
  "2024",
  "2025",
  "2026",
];

let cancelled = false;

function buildCharset(options: WorkerCharsetOptions): string {
  let charset = "";
  if (options.lowercase) charset += "abcdefghijklmnopqrstuvwxyz";
  if (options.uppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.digits) charset += "0123456789";
  if (options.special) charset += "!@#$%^&*()-_=+[]{}|;:',.<>?/`~";
  charset += options.custom || "";
  return [...new Set(charset.split(""))].join("");
}

function estimateTotal(charset: string, minLength: number, maxLength: number, tryCommon: boolean): number {
  const size = charset.length;
  if (!size && !tryCommon) return 0;
  let brute = 0;
  for (let len = minLength; len <= maxLength; len += 1) {
    brute += Math.pow(size, len);
  }
  return brute + (tryCommon ? COMMON_PASSWORDS.length : 0);
}

function isWrongPassword(error: unknown): boolean {
  if (error instanceof EncryptedPDFError) return true;
  const text =
    error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");
  return /incorrect password|wrong password|invalid password|bad password|password.*(fail|invalid|incorrect|wrong)|decrypt|authentication/i.test(
    text,
  );
}

async function passwordOpensPdf(bytes: Uint8Array, password: string): Promise<boolean> {
  try {
    await PDFDocument.load(bytes, { password });
    return true;
  } catch (error) {
    if (isWrongPassword(error)) return false;
    throw error;
  }
}

function* generatePasswords(charset: string, length: number): Generator<string> {
  const chars = charset.split("");
  const indices = new Array(length).fill(0);
  while (true) {
    yield indices.map((i) => chars[i]).join("");
    let pos = length - 1;
    while (pos >= 0) {
      indices[pos] += 1;
      if (indices[pos] < chars.length) break;
      indices[pos] = 0;
      pos -= 1;
    }
    if (pos < 0) return;
  }
}

async function runSearch(payload: WorkerStartPayload) {
  const bytes = new Uint8Array(payload.pdfBytes);
  const charset = buildCharset(payload.charset);
  const minLength = Math.max(1, payload.minLength);
  const maxLength = Math.max(minLength, payload.maxLength);
  const total = estimateTotal(charset, minLength, maxLength, payload.tryCommon);
  let tried = 0;

  const reportProgress = () => {
    self.postMessage({
      type: "progress",
      tried,
      total,
    });
  };

  const tryCandidate = async (candidate: string): Promise<boolean> => {
    if (cancelled) return true;
    tried += 1;
    if (tried > payload.maxAttempts) {
      self.postMessage({ type: "limit", tried, total });
      return true;
    }
    if (tried % 25 === 0) reportProgress();
    const ok = await passwordOpensPdf(bytes, candidate);
    if (ok) {
      self.postMessage({ type: "found", password: candidate, tried, total });
      return true;
    }
    return false;
  };

  if (payload.tryCommon) {
    for (const candidate of COMMON_PASSWORDS) {
      if (await tryCandidate(candidate)) return;
    }
  }

  if (!charset) {
    self.postMessage({ type: "not-found", tried, total });
    return;
  }

  for (let length = minLength; length <= maxLength; length += 1) {
    for (const candidate of generatePasswords(charset, length)) {
      if (await tryCandidate(candidate)) return;
    }
  }

  self.postMessage({ type: "not-found", tried, total });
}

self.onmessage = (event: MessageEvent<WorkerStartPayload | { type: "cancel" }>) => {
  if (event.data?.type === "cancel") {
    cancelled = true;
    return;
  }
  if (event.data?.type !== "start") return;

  cancelled = false;
  void runSearch(event.data).catch((error) => {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Password recovery failed.",
    });
  });
};
