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
  /** Directory containing tesseract-core*.wasm.js builds, or a specific .wasm.js URL. */
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

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ""}`;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function assertAssetReachable(url: string): Promise<void> {
  let response = await fetch(url, { method: "HEAD", cache: "no-store" });
  // Some static hosts reject HEAD — fall back to a 1-byte range GET.
  if (response.status === 405 || response.status === 501 || response.status === 400) {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: { Range: "bytes=0-0" },
    });
  }
  console.log("[PDF-OCR] asset check", {
    url,
    status: response.status,
    ok: response.ok,
    type: response.type,
    contentType: response.headers.get("content-type"),
  });
  if (!response.ok && response.status !== 206) {
    throw new Error(`OCR asset HTTP ${response.status} for ${url}`);
  }
}

/** Fetch a JS asset and expose it as a blob: URL (avoids nested-Worker CORS/COEP pitfalls). */
async function toScriptBlobUrl(url: string): Promise<string> {
  const response = await fetch(url, { cache: "no-store" });
  console.log("[PDF-OCR] blobify", { url, status: response.status, ok: response.ok });
  if (!response.ok) {
    throw new Error(`Failed to fetch OCR script (${response.status}): ${url}`);
  }
  const buffer = await response.arrayBuffer();
  const blob = new Blob([buffer], { type: "text/javascript" });
  return URL.createObjectURL(blob);
}

async function recognizeOnce(
  blob: Blob,
  languages: string,
  paths: { langPath: string; workerPath: string; corePath: string },
  gzip: boolean,
  pageIndex: number,
): Promise<string> {
  let workerBlobUrl: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tesseractWorker: any = null;

  try {
    console.log("[PDF-OCR] init paths", paths);

    // Preflight critical assets so production 403/404s are visible in the console.
    const coreJs = paths.corePath.endsWith(".js")
      ? paths.corePath
      : `${paths.corePath.replace(/\/$/, "")}/tesseract-core.wasm.js`;
    await assertAssetReachable(paths.workerPath);
    await assertAssetReachable(coreJs);
    await assertAssetReachable(`${paths.langPath.replace(/\/$/, "")}/heb.traineddata.gz`);
    await assertAssetReachable(`${paths.langPath.replace(/\/$/, "")}/eng.traineddata.gz`);

    workerBlobUrl = await toScriptBlobUrl(paths.workerPath);

    const { createWorker, OEM, PSM } = await import("tesseract.js");

    tesseractWorker = await createWorker(languages, OEM.LSTM_ONLY, {
      langPath: paths.langPath.replace(/\/$/, ""),
      // Prefer directory so Tesseract can pick SIMD/LSTM builds when available.
      corePath: paths.corePath.replace(/\/$/, ""),
      workerPath: workerBlobUrl,
      gzip,
      workerBlobURL: false,
      errorHandler: (err: unknown) => {
        console.error("[PDF-OCR] Tesseract errorHandler:", err);
        console.error("[PDF-OCR] Tesseract errorHandler (formatted):", formatError(err));
      },
      logger: (message) => {
        console.log("[PDF-OCR] tesseract:", message);
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

    await tesseractWorker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: "1",
    });
    const result = await tesseractWorker.recognize(blob);
    return (result.data.text || "").replace(/\u000c/g, "").trim();
  } catch (error) {
    console.error("[PDF-OCR] createWorker/recognize FAILED (full error):", error);
    console.error("[PDF-OCR] createWorker/recognize FAILED (formatted):", formatError(error));
    throw error;
  } finally {
    try {
      if (tesseractWorker) await tesseractWorker.terminate();
    } catch (terminateError) {
      console.error("[PDF-OCR] terminate failed:", terminateError);
    }
    if (workerBlobUrl) {
      URL.revokeObjectURL(workerBlobUrl);
    }
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
          console.warn("[PDF-OCR] retrying page", pageIndex);
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
        console.error(`[PDF-OCR] attempt ${attempt + 1} failed:`, error);
        console.error(`[PDF-OCR] attempt ${attempt + 1} formatted:`, formatError(error));
      }
    }

    if (lastError) {
      throw lastError instanceof Error ? lastError : new Error("OCR failed in worker.");
    }

    reply({ type: "ok", pageIndex, text });
  } catch (error) {
    console.error("[PDF-OCR] page failed (full error object):", error);
    console.error("[PDF-OCR] page failed (formatted):", formatError(error));
    reply({
      type: "error",
      pageIndex,
      message: error instanceof Error ? error.message : "OCR failed in worker.",
    });
  }
};

export {};
