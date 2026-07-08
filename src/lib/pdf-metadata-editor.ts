import { PDFDocument, PDFName } from "pdf-lib-with-encrypt";

export type PdfMetadataFormValues = {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
};

export const PDF_METADATA_FORM_FIELDS: ReadonlyArray<{
  key: keyof PdfMetadataFormValues;
  label: string;
}> = [
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
  { key: "subject", label: "Subject" },
  { key: "keywords", label: "Keywords" },
  { key: "creator", label: "Creator" },
  { key: "producer", label: "Producer" },
];

export const EMPTY_PDF_METADATA_FORM: PdfMetadataFormValues = {
  title: "",
  author: "",
  subject: "",
  keywords: "",
  creator: "",
  producer: "",
};

async function loadDocument(source: Uint8Array, password?: string): Promise<PDFDocument> {
  const loadOptions = password?.trim() ? { password: password.trim() } : {};
  try {
    return await PDFDocument.load(source, loadOptions);
  } catch {
    return await PDFDocument.load(source, { ignoreEncryption: true });
  }
}

function keywordsToString(keywords: string | string[] | undefined): string {
  if (!keywords) return "";
  if (Array.isArray(keywords)) return keywords.filter(Boolean).join(", ");
  return keywords.trim();
}

function parseKeywordsInput(value: string): string[] {
  return value
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function removeXmpPacket(doc: PDFDocument) {
  try {
    doc.catalog.delete(PDFName.of("Metadata"));
  } catch {
    // Catalog may not expose Metadata on some files.
  }
}

/** Read editable Info dictionary fields for the metadata form. */
export async function readPdfMetadataForm(
  file: File,
  options?: { password?: string },
): Promise<PdfMetadataFormValues> {
  const source = new Uint8Array(await file.arrayBuffer());
  const password = options?.password?.trim() || undefined;
  const doc = await loadDocument(source, password);

  if (doc.isEncrypted && !password) {
    throw new Error("This PDF is password-protected. Enter the password to read metadata.");
  }

  return {
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    keywords: keywordsToString(doc.getKeywords()),
    creator: doc.getCreator() ?? "",
    producer: doc.getProducer() ?? "",
  };
}

/** Apply metadata form values to the PDF Info dictionary locally. */
export async function applyPdfMetadataUpdate(
  file: File,
  values: PdfMetadataFormValues,
  options?: { password?: string },
): Promise<Uint8Array> {
  const source = new Uint8Array(await file.arrayBuffer());
  const password = options?.password?.trim() || undefined;
  const doc = await loadDocument(source, password);

  if (doc.isEncrypted && !password) {
    throw new Error("This PDF is password-protected. Enter the password to save metadata.");
  }

  doc.setTitle(values.title.trim());
  doc.setAuthor(values.author.trim());
  doc.setSubject(values.subject.trim());
  doc.setKeywords(parseKeywordsInput(values.keywords));
  doc.setCreator(values.creator.trim());
  doc.setProducer(values.producer.trim());
  doc.setModificationDate(new Date());
  removeXmpPacket(doc);

  return doc.save({ useObjectStreams: false });
}

export function pdfMetadataEditorOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-metadata.pdf`;
}
