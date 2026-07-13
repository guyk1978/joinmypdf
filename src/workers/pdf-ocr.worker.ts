/// <reference lib="webworker" />

export type PdfOcrWorkerRequest = {
  type: "ocr-page";
  pageIndex: number;
  /** Image blob — structured-clone safe (no ArrayBuffer transfer). */
  blob: Blob;
  /** Tesseract language code(s), e.g. "heb+eng". */
  languages: string;
  /** Absolute same-origin paths (required inside nested Workers; relative URLs resolve to blob:). */
  langPath: string;
  workerPath: string;
  /** Directory containing tesseract-core*.wasm.js builds. */
  corePath: string;
  gzip?: boolean;
};

export type PdfOcrWorkerResponse =
  | {
      type: "progress";
      percent: number;
      pageIndex: number;
      status: string;
    }
  | {
      type: "ok";
      pageIndex: number;
      text: string;
    }
  | { type: "error"; pageIndex: number; message: string };

const reply = (payload: PdfOcrWorkerResponse) => {
  (self as DedicatedWorkerGlobalScope).postMessage(payload);
};

async function recognizeOnce(
  blob: Blob,
  languages: string,
  paths: { langPath: string; workerPath: string; corePath: string },
  gzip: boolean,
  pageIndex: number,
): Promise<string> {
  const { createWorker, OEM, PSM } = await import("tesseract.js");

  const worker = await createWorker(languages, OEM.LSTM_ONLY, {
    langPath: paths.langPath,
    workerPath: paths.workerPath,
    corePath: paths.corePath,
    gzip,
    // Same-origin classic worker script — required to avoid CDN CORS on nested Workers.
    workerBlobURL: false,
    logger: (message) => {
      console.log(message);
      if (message.status === "loading language traineddata") {
        reply({ type: "progress", percent: 8, pageIndex, status: "loading-lang" });
      }
      if (message.status === "initializing api") {
        reply({ type: "progress", percent: 12, pageIndex, status: "init" });
      }
      if (message.status === "recognizing text" && typeof message.progress === "number") {
        reply({
          type: "progress",
          percent: Math.max(15, Math.min(95, Math.round(message.progress * 100))),
          pageIndex,
          status: "recognizing",
        });
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: "1",
    });
    const result = await worker.recognize(blob);
    return (result.data.text || "").replace(/\u000c/g, "").trim();
  } finally {
    await worker.terminate();
  }
}

self.onmessage = async (event: MessageEvent<PdfOcrWorkerRequest>) => {
  const data = event.data;
  if (!data || data.type !== "ocr-page") return;

  const pageIndex = data.pageIndex;
  const languages = (data.languages || "heb+eng").trim() || "heb+eng";
  const gzip = data.gzip !== false;

  try {
    reply({ type: "progress", percent: 5, pageIndex, status: "starting" });

    let text = "";
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        if (attempt === 1) {
          reply({ type: "progress", percent: 10, pageIndex, status: "retry" });
        }
        text = await recognizeOnce(
          data.blob,
          languages,
          {
            langPath: data.langPath,
            workerPath: data.workerPath,
            corePath: data.corePath,
          },
          gzip,
          pageIndex,
        );
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      throw lastError instanceof Error ? lastError : new Error("OCR failed in worker.");
    }

    reply({ type: "ok", pageIndex, text });
  } catch (error) {
    reply({
      type: "error",
      pageIndex,
      message: error instanceof Error ? error.message : "OCR failed in worker.",
    });
  }
};

export {};
