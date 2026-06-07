import { PDFDocument } from "pdf-lib-with-encrypt";

export class PdfRepairTooCorruptedError extends Error {
  readonly userMessage = "This file structure is too corrupted to be repaired locally.";

  constructor() {
    super("This file structure is too corrupted to be repaired locally.");
    this.name = "PdfRepairTooCorruptedError";
  }
}

export type RepairPdfPhase = "scanning" | "structure" | "xref" | "rebuild" | "validate";

export type RepairPdfProgress = {
  phase: RepairPdfPhase;
  percent: number;
  detail?: string;
};

async function setupPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

function hasPdfHeader(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);
  return header.startsWith("%PDF-");
}

function trimAfterLastEof(bytes: Uint8Array): Uint8Array {
  const text = new TextDecoder("latin1").decode(bytes);
  const lastEof = text.lastIndexOf("%%EOF");
  if (lastEof < 0) return bytes;

  let end = lastEof + 5;
  while (end < bytes.length && (bytes[end] === 0x0a || bytes[end] === 0x0d || bytes[end] === 0x20)) {
    end += 1;
  }

  return end < bytes.length ? bytes.slice(0, end) : bytes;
}

function scanStructureIssues(bytes: Uint8Array): string[] {
  const text = new TextDecoder("latin1").decode(bytes);
  const issues: string[] = [];

  if (!text.includes("xref") && !text.includes("/Type /XRef")) {
    issues.push("missing-xref");
  }
  if (!text.includes("startxref")) {
    issues.push("missing-startxref");
  }
  if ((text.match(/%%EOF/g) || []).length > 1) {
    issues.push("multiple-eof");
  }

  return issues;
}

async function validateWithPdfjs(bytes: Uint8Array, password?: string): Promise<boolean> {
  try {
    const pdfjs = await setupPdfJs();
    const doc = await pdfjs.getDocument({ data: bytes.slice(), password }).promise;
    if (doc.numPages < 1) return false;
    await doc.getPage(1);
    return true;
  } catch {
    return false;
  }
}

async function tryPdfLibResave(bytes: Uint8Array, password?: string): Promise<Uint8Array | null> {
  const loadOpts = password ? { password } : { ignoreEncryption: true };
  try {
    const doc = await PDFDocument.load(bytes, loadOpts);
    return doc.save({ useObjectStreams: false });
  } catch {
    return null;
  }
}

async function tryPageByPageRebuild(bytes: Uint8Array, password?: string): Promise<Uint8Array | null> {
  const loadOpts = password ? { password } : { ignoreEncryption: true };
  try {
    const source = await PDFDocument.load(bytes, loadOpts);
    const out = await PDFDocument.create();
    let added = 0;

    for (const pageIndex of source.getPageIndices()) {
      try {
        const [page] = await out.copyPages(source, [pageIndex]);
        out.addPage(page);
        added += 1;
      } catch {
        // Skip unreadable pages.
      }
    }

    if (added === 0) return null;
    return out.save({ useObjectStreams: false });
  } catch {
    return null;
  }
}

async function attemptRepair(
  bytes: Uint8Array,
  password?: string,
): Promise<Uint8Array | null> {
  const candidates = [bytes];

  const trimmed = trimAfterLastEof(bytes);
  if (trimmed.length !== bytes.length) {
    candidates.unshift(trimmed);
  }

  for (const candidate of candidates) {
    const resaved = await tryPdfLibResave(candidate, password);
    if (resaved) return resaved;

    const rebuilt = await tryPageByPageRebuild(candidate, password);
    if (rebuilt) return rebuilt;
  }

  return null;
}

/** Attempt local structural repair for malformed PDFs. */
export async function repairPdfBytes(
  source: Uint8Array,
  options?: { password?: string; onProgress?: (progress: RepairPdfProgress) => void },
): Promise<Uint8Array> {
  const password = options?.password?.trim() || undefined;
  const onProgress = options?.onProgress;

  onProgress?.({
    phase: "scanning",
    percent: 8,
    detail: "Checking PDF header and file markers…",
  });

  if (!hasPdfHeader(source)) {
    throw new PdfRepairTooCorruptedError();
  }

  onProgress?.({
    phase: "structure",
    percent: 24,
    detail: "Scanning document structure…",
  });

  const issues = scanStructureIssues(source);
  if (issues.includes("missing-xref") && issues.includes("missing-startxref")) {
    onProgress?.({
      phase: "xref",
      percent: 38,
      detail: "Cross-reference table appears damaged…",
    });
  } else {
    onProgress?.({
      phase: "xref",
      percent: 38,
      detail: "Analyzing cross-reference tables…",
    });
  }

  onProgress?.({
    phase: "rebuild",
    percent: 58,
    detail: "Rebuilding objects and page streams…",
  });

  const repaired = await attemptRepair(source, password);
  if (!repaired) {
    throw new PdfRepairTooCorruptedError();
  }

  onProgress?.({
    phase: "validate",
    percent: 82,
    detail: "Validating repaired PDF…",
  });

  const valid = await validateWithPdfjs(repaired, password);
  if (!valid) {
    throw new PdfRepairTooCorruptedError();
  }

  onProgress?.({
    phase: "validate",
    percent: 100,
    detail: "Repair complete.",
  });

  return repaired;
}

export async function repairPdfFromFile(
  file: File,
  options?: { password?: string; onProgress?: (progress: RepairPdfProgress) => void },
): Promise<Uint8Array> {
  const source = new Uint8Array(await file.arrayBuffer());
  return repairPdfBytes(source, options);
}

export function repairPdfOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-repaired.pdf`;
}
