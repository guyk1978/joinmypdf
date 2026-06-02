import { PDFDocument, PDFName } from "pdf-lib-with-encrypt";

export type PdfMetadataEntry = {
  key: string;
  label: string;
  value: string;
};

function formatDate(value: Date | undefined): string | null {
  if (!value) return null;
  try {
    return value.toISOString();
  } catch {
    return String(value);
  }
}

function pushField(entries: PdfMetadataEntry[], key: string, label: string, value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return;
  entries.push({ key, label, value: trimmed });
}

function parseXmpHints(xmp: string): PdfMetadataEntry[] {
  const hints: PdfMetadataEntry[] = [];
  if (!xmp?.trim()) return hints;

  hints.push({
    key: "xmp-packet",
    label: "XMP metadata packet",
    value: `Embedded (${Math.round(xmp.length / 1024)} KB approx.)`,
  });

  const patterns: { key: string; label: string; re: RegExp }[] = [
    { key: "xmp-creator", label: "XMP creator tool", re: /<xmp:CreatorTool[^>]*>([^<]+)</i },
    { key: "xmp-author", label: "XMP author", re: /<dc:creator[^>]*>(?:<rdf:li[^>]*>)?([^<]+)/i },
    { key: "xmp-title", label: "XMP title", re: /<dc:title[^>]*>(?:<rdf:Alt[^>]*>)?(?:<rdf:li[^>]*>)?([^<]+)/i },
    { key: "xmp-software", label: "XMP software", re: /<pdf:Producer[^>]*>([^<]+)</i },
  ];

  for (const { key, label, re } of patterns) {
    const match = xmp.match(re);
    if (match?.[1]?.trim()) {
      hints.push({ key, label, value: match[1].trim() });
    }
  }

  return hints;
}

async function loadDocument(source: Uint8Array, password?: string): Promise<PDFDocument> {
  const loadOptions = password?.trim() ? { password: password.trim() } : {};
  try {
    return await PDFDocument.load(source, loadOptions);
  } catch {
    return await PDFDocument.load(source, { ignoreEncryption: true });
  }
}

/** Read document Info dictionary and XMP hints for display before cleaning. */
export async function readPdfMetadata(
  file: File,
  options?: { password?: string },
): Promise<PdfMetadataEntry[]> {
  const source = new Uint8Array(await file.arrayBuffer());
  const password = options?.password?.trim() || undefined;
  const doc = await loadDocument(source, password);

  if (doc.isEncrypted && !password) {
    throw new Error("This PDF is password-protected. Enter the password to scan metadata.");
  }

  const entries: PdfMetadataEntry[] = [];

  pushField(entries, "title", "Title", doc.getTitle());
  pushField(entries, "author", "Author", doc.getAuthor());
  pushField(entries, "subject", "Subject", doc.getSubject());
  pushField(entries, "keywords", "Keywords", doc.getKeywords());
  pushField(entries, "creator", "Creator application", doc.getCreator());
  pushField(entries, "producer", "Producer software", doc.getProducer());
  pushField(entries, "creation-date", "Creation date", formatDate(doc.getCreationDate()));
  pushField(entries, "mod-date", "Modification date", formatDate(doc.getModificationDate()));

  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

  const pdfJsDoc = await pdfjs.getDocument({ data: source.slice(), password }).promise;
  const meta = await pdfJsDoc.getMetadata().catch(() => null);
  const info = meta?.info as Record<string, string> | undefined;

  if (info) {
    for (const [rawKey, rawValue] of Object.entries(info)) {
      if (rawValue == null || rawValue === "") continue;
      const normalized = rawKey.replace(/([A-Z])/g, " $1").trim();
      const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      const exists = entries.some(
        (e) => e.value === String(rawValue) && e.label.toLowerCase() === label.toLowerCase(),
      );
      if (!exists) {
        entries.push({ key: `info-${rawKey}`, label, value: String(rawValue) });
      }
    }
  }

  if (typeof meta?.metadata === "string") {
    const xmpEntries = parseXmpHints(meta.metadata);
    for (const entry of xmpEntries) {
      if (!entries.some((e) => e.key === entry.key)) entries.push(entry);
    }
  }

  return entries;
}

function clearInfoDictionary(doc: PDFDocument) {
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setCreator("");
  doc.setProducer("");
}

function removeXmpPacket(doc: PDFDocument) {
  try {
    doc.catalog.delete(PDFName.of("Metadata"));
  } catch {
    // Catalog may not expose Metadata on some files.
  }
}

/** Strip Info fields and XMP metadata; returns cleaned PDF bytes. */
export async function cleanPdfMetadata(
  file: File,
  options?: { password?: string },
): Promise<Uint8Array> {
  const source = new Uint8Array(await file.arrayBuffer());
  const password = options?.password?.trim() || undefined;
  const doc = await loadDocument(source, password);

  if (doc.isEncrypted && !password) {
    throw new Error("This PDF is password-protected. Enter the password to clean metadata.");
  }

  clearInfoDictionary(doc);
  removeXmpPacket(doc);

  return doc.save({ useObjectStreams: false });
}

export function cleanPdfMetadataOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-clean.pdf`;
}
