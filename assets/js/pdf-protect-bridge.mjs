/**
 * Browser bridge: QPDF WASM encrypt (structure-preserving) for static HTML tool pages.
 */

let runnerPromise = null;

function resolveOriginUrl(pathname) {
  return new URL(pathname, window.location.origin).href;
}

function buildRunnerSources() {
  const local = {
    label: "local-vendor",
    moduleUrl: resolveOriginUrl("/vendor/qpdf-run/index.js"),
    workerUrl: resolveOriginUrl("/vendor/qpdf/worker.js"),
    qpdfJsUrl: resolveOriginUrl("/vendor/qpdf/qpdf.js"),
    wasmUrl: resolveOriginUrl("/vendor/qpdf/qpdf.wasm"),
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

function getRunner() {
  if (!runnerPromise) {
    runnerPromise = (async function initRunner() {
      const sources = buildRunnerSources();
      let lastError = null;

      for (const source of sources) {
        try {
          const mod = await import(source.moduleUrl);
          const createQpdfRunner = mod && mod.createQpdfRunner;
          if (typeof createQpdfRunner !== "function") {
            throw new Error("createQpdfRunner export not found");
          }
          const runner = await createQpdfRunner({
            workerUrl: source.workerUrl,
            qpdfJsUrl: source.qpdfJsUrl,
            wasmUrl: source.wasmUrl,
          });
          console.info("[qpdf-static] runner initialized", source.label, {
            workerUrl: source.workerUrl,
            qpdfJsUrl: source.qpdfJsUrl,
            wasmUrl: source.wasmUrl,
          });
          return runner;
        } catch (error) {
          lastError = error;
          console.error("[qpdf-static] runner init failed", source.label, error);
        }
      }

      throw lastError || new Error("Failed to initialize QPDF runner from local and CDN sources.");
    })();
  }
  return runnerPromise;
}

export async function protectPdfBytes(bytes, password) {
  const trimmed = String(password || "").trim();
  if (!trimmed) throw new Error("Enter a password.");
  if (trimmed.length < 4) throw new Error("Use a password with at least 4 characters.");

  try {
    const qpdf = await getRunner();
    return await qpdf.runOne({
      input: bytes,
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
    console.error("[qpdf-static] protectPdfBytes failed", error);
    throw error;
  }
}

window.PDFProtect = { protect: protectPdfBytes, ready: true };
