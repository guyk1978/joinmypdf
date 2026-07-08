import { PDFDocument, PDFName } from "pdf-lib-with-encrypt";

export type PdfLinearizeProgress = {
  phase: "loading" | "optimizing" | "finalizing";
  currentPage: number;
  totalPages: number;
};

async function loadDocument(source: Uint8Array, password?: string): Promise<PDFDocument> {
  const loadOptions = password?.trim() ? { password: password.trim() } : {};
  try {
    return await PDFDocument.load(source, loadOptions);
  } catch {
    return await PDFDocument.load(source, { ignoreEncryption: true });
  }
}

function flattenInteractiveLayers(doc: PDFDocument) {
  try {
    const form = doc.getForm();
    if (form.getFields().length > 0) {
      form.flatten();
    }
  } catch {
    // No AcroForm present.
  }
}

function markLinearized(doc: PDFDocument) {
  try {
    doc.catalog.set(PDFName.of("Linearized"), doc.context.obj(true));
  } catch {
    // Best-effort catalog flag for Fast Web View consumers.
  }
}

/**
 * Rebuild a PDF for web-optimized delivery: linear page order, no object streams,
 * and the catalog Linearized flag for Fast Web View–compatible viewers.
 */
export async function linearizePdfBytes(
  source: Uint8Array,
  options?: { password?: string; onProgress?: (progress: PdfLinearizeProgress) => void },
): Promise<Uint8Array> {
  const password = options?.password?.trim() || undefined;
  const onProgress = options?.onProgress;

  onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });

  const sourceDoc = await loadDocument(source, password);
  if (sourceDoc.isEncrypted && !password) {
    throw new Error("This PDF is password-protected. Enter the password to linearize it.");
  }

  flattenInteractiveLayers(sourceDoc);
  const workingBytes = await sourceDoc.save({ useObjectStreams: false });
  const workingDoc = await loadDocument(workingBytes, password);
  const totalPages = workingDoc.getPageCount();

  onProgress?.({ phase: "optimizing", currentPage: 0, totalPages });

  const outDoc = await PDFDocument.create();
  for (let i = 0; i < totalPages; i += 1) {
    const [copied] = await outDoc.copyPages(workingDoc, [i]);
    outDoc.addPage(copied);
    onProgress?.({ phase: "optimizing", currentPage: i + 1, totalPages });
  }

  const title = workingDoc.getTitle();
  if (title) outDoc.setTitle(title);
  outDoc.setProducer("JoinMyPDF PDF Linearization");
  outDoc.setCreator("JoinMyPDF PDF Linearization (Fast Web View)");
  outDoc.setModificationDate(new Date());

  markLinearized(outDoc);

  onProgress?.({ phase: "finalizing", currentPage: totalPages, totalPages });

  return outDoc.save({ useObjectStreams: false });
}

export async function linearizePdfFromFile(
  file: File,
  options?: { password?: string; onProgress?: (progress: PdfLinearizeProgress) => void },
): Promise<Uint8Array> {
  const source = new Uint8Array(await file.arrayBuffer());
  return linearizePdfBytes(source, options);
}

export function pdfLinearizationOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-linearized.pdf`;
}
