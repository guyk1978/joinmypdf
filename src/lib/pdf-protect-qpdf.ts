/**
 * Structure-preserving PDF password protection via QPDF WASM.
 * Does not parse/re-serialize content through pdf-lib (avoids Hebrew/font corruption).
 */

type QpdfRunner = {
  runOne: (options: {
    input: Uint8Array;
    inputName: string;
    outputName: string;
    args: string[];
  }) => Promise<Uint8Array>;
};

let runnerPromise: Promise<QpdfRunner> | null = null;

function resolveAsset(pathname: string) {
  if (typeof window === "undefined") return pathname;
  return new URL(pathname, window.location.origin).href;
}

export async function getQpdfProtectRunner(): Promise<QpdfRunner> {
  if (typeof window === "undefined") {
    throw new Error("PDF password protection must run in the browser.");
  }
  if (!runnerPromise) {
    const { createQpdfRunner } = await import("qpdf-run");
    runnerPromise = createQpdfRunner({
      workerUrl: resolveAsset("/vendor/qpdf/worker.js"),
      qpdfJsUrl: resolveAsset("/vendor/qpdf/qpdf.js"),
      wasmUrl: resolveAsset("/vendor/qpdf/qpdf.wasm"),
    });
  }
  return runnerPromise;
}

/** Encrypt PDF bytes in-place at structure level (fonts/layout preserved). */
export async function protectPdfBytesQpdf(source: Uint8Array, password: string): Promise<Uint8Array> {
  const trimmed = String(password || "").trim();
  if (!trimmed) throw new Error("Enter a password.");
  if (trimmed.length < 4) throw new Error("Use a password with at least 4 characters.");

  const qpdf = await getQpdfProtectRunner();
  return qpdf.runOne({
    input: source,
    inputName: "input.pdf",
    outputName: "protected.pdf",
    args: [
      "--encrypt",
      trimmed,
      trimmed,
      "256",
      "--print=full",
      "--modify=none",
      "--extract=n",
      "--annotate=n",
      "--form=none",
      "--assemble=none",
      "--cleartext-metadata",
      "--",
      "input.pdf",
      "protected.pdf",
    ],
  });
}
