/**
 * Browser bridge: QPDF WASM encrypt (structure-preserving) for static HTML tool pages.
 */
import { createQpdfRunner } from "/vendor/qpdf-run/index.js";

let runnerPromise = null;

function getRunner() {
  if (!runnerPromise) {
    runnerPromise = createQpdfRunner({
      workerUrl: "/vendor/qpdf/worker.js",
      qpdfJsUrl: "/vendor/qpdf/qpdf.js",
      wasmUrl: "/vendor/qpdf/qpdf.wasm",
    });
  }
  return runnerPromise;
}

export async function protectPdfBytes(bytes, password) {
  const trimmed = String(password || "").trim();
  if (!trimmed) throw new Error("Enter a password.");
  if (trimmed.length < 4) throw new Error("Use a password with at least 4 characters.");

  const qpdf = await getRunner();
  return qpdf.runOne({
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
}

window.PDFProtect = { protect: protectPdfBytes, ready: true };
