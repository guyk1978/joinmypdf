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

type RunnerSource = {
  label: string;
  moduleUrl: string;
  workerUrl: string;
  qpdfJsUrl: string;
  wasmUrl: string;
};

function buildRunnerSources(): RunnerSource[] {
  const local = {
    label: "local-vendor",
    moduleUrl: resolveAsset("/vendor/qpdf-run/index.js"),
    workerUrl: resolveAsset("/vendor/qpdf/worker.js"),
    qpdfJsUrl: resolveAsset("/vendor/qpdf/qpdf.js"),
    wasmUrl: resolveAsset("/vendor/qpdf/qpdf.wasm"),
  };

  const cdnBase = "https://cdn.jsdelivr.net/npm/qpdf-run@0.2.1";
  const cdn = {
    label: "cdn-jsdelivr",
    moduleUrl: `${cdnBase}/src/index.js`,
    workerUrl: `${cdnBase}/src/worker.js`,
    qpdfJsUrl: `${cdnBase}/vendor/qpdf/lib/qpdf.js`,
    wasmUrl: `${cdnBase}/vendor/qpdf/lib/qpdf.wasm`,
  };

  return [local, cdn];
}

export async function getQpdfProtectRunner(): Promise<QpdfRunner> {
  if (typeof window === "undefined") {
    throw new Error("PDF password protection must run in the browser.");
  }
  if (!runnerPromise) {
    runnerPromise = (async () => {
      const sources = buildRunnerSources();
      let lastError: unknown = null;

      for (const source of sources) {
        try {
          const mod = await import(/* @vite-ignore */ source.moduleUrl);
          const createQpdfRunner = (mod as { createQpdfRunner?: Function }).createQpdfRunner;
          if (typeof createQpdfRunner !== "function") {
            throw new Error("createQpdfRunner export not found");
          }
          const runner = (await createQpdfRunner({
            workerUrl: source.workerUrl,
            qpdfJsUrl: source.qpdfJsUrl,
            wasmUrl: source.wasmUrl,
          })) as QpdfRunner;
          console.info("[qpdf] runner initialized", source.label, {
            workerUrl: source.workerUrl,
            qpdfJsUrl: source.qpdfJsUrl,
            wasmUrl: source.wasmUrl,
          });
          return runner;
        } catch (error) {
          lastError = error;
          console.error("[qpdf] runner init failed", source.label, error);
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error("Failed to initialize QPDF runner from local and CDN sources.");
    })();
  }
  return runnerPromise;
}

/** Encrypt PDF bytes in-place at structure level (fonts/layout preserved). */
export async function protectPdfBytesQpdf(source: Uint8Array, password: string): Promise<Uint8Array> {
  const trimmed = String(password || "").trim();
  if (!trimmed) throw new Error("Enter a password.");
  if (trimmed.length < 4) throw new Error("Use a password with at least 4 characters.");

  try {
    const qpdf = await getQpdfProtectRunner();
    return await qpdf.runOne({
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
  } catch (error) {
    console.error("[qpdf] protectPdfBytesQpdf failed", error);
    throw error;
  }
}
