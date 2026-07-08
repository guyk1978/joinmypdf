import { PDFDocument, PDFName } from "pdf-lib-with-encrypt";

export type PdfAProfile = "pdfa-1b" | "pdfa-2b";

export type PdfAConvertProgress = {
  phase: "loading" | "normalizing" | "metadata" | "finalizing";
  currentPage: number;
  totalPages: number;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildPdfAXmpPacket(title: string, profile: PdfAProfile): string {
  const now = new Date().toISOString();
  const part = profile === "pdfa-2b" ? "2" : "1";
  const safeTitle = escapeXml(title || "Archival document");

  return `<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdfaid:part>${part}</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${safeTitle}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <xmp:CreatorTool>JoinMyPDF PDF/A Converter</xmp:CreatorTool>
      <xmp:ModifyDate>${now}</xmp:ModifyDate>
      <pdf:Producer>JoinMyPDF PDF/A Converter</pdf:Producer>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

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

function attachPdfAMetadata(doc: PDFDocument, title: string, profile: PdfAProfile) {
  const xmp = buildPdfAXmpPacket(title, profile);
  const metadataStream = doc.context.stream(xmp, {
    Type: "Metadata",
    Subtype: "XML",
  });
  const metadataRef = doc.context.register(metadataStream);
  doc.catalog.set(PDFName.of("Metadata"), metadataRef);
}

/** Normalize a PDF for archival output with PDF/A-oriented metadata. */
export async function convertPdfToPdfABytes(
  source: Uint8Array,
  options?: {
    password?: string;
    profile?: PdfAProfile;
    onProgress?: (progress: PdfAConvertProgress) => void;
  },
): Promise<Uint8Array> {
  const password = options?.password?.trim() || undefined;
  const profile = options?.profile ?? "pdfa-1b";
  const onProgress = options?.onProgress;

  onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });

  const sourceDoc = await loadDocument(source, password);
  if (sourceDoc.isEncrypted && !password) {
    throw new Error("This PDF is password-protected. Enter the password to convert it.");
  }

  const title = sourceDoc.getTitle() || "Archival document";
  const author = sourceDoc.getAuthor();
  const subject = sourceDoc.getSubject();

  flattenInteractiveLayers(sourceDoc);

  const normalizedBytes = await sourceDoc.save({ useObjectStreams: false });
  const workingDoc = await loadDocument(normalizedBytes, password);
  const totalPages = workingDoc.getPageCount();

  onProgress?.({ phase: "normalizing", currentPage: 0, totalPages });

  const outDoc = await PDFDocument.create();
  const pageIndices = Array.from({ length: totalPages }, (_, index) => index);

  for (let i = 0; i < pageIndices.length; i += 1) {
    const [copied] = await outDoc.copyPages(workingDoc, [pageIndices[i]]);
    outDoc.addPage(copied);
    onProgress?.({ phase: "normalizing", currentPage: i + 1, totalPages });
  }

  onProgress?.({ phase: "metadata", currentPage: totalPages, totalPages });

  if (title) outDoc.setTitle(title);
  if (author) outDoc.setAuthor(author);
  if (subject) outDoc.setSubject(subject);
  outDoc.setCreator("JoinMyPDF PDF/A Converter");
  outDoc.setProducer("JoinMyPDF PDF/A Converter");
  outDoc.setModificationDate(new Date());
  outDoc.setCreationDate(new Date());

  attachPdfAMetadata(outDoc, title, profile);

  onProgress?.({ phase: "finalizing", currentPage: totalPages, totalPages });

  return outDoc.save({ useObjectStreams: false });
}

export async function convertPdfToPdfAFromFile(
  file: File,
  options?: {
    password?: string;
    profile?: PdfAProfile;
    onProgress?: (progress: PdfAConvertProgress) => void;
  },
): Promise<Uint8Array> {
  const source = new Uint8Array(await file.arrayBuffer());
  return convertPdfToPdfABytes(source, options);
}

export function pdfAConverterOutputName(file: File, profile: PdfAProfile = "pdfa-1b") {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  const suffix = profile === "pdfa-2b" ? "pdfa-2b" : "pdfa-1b";
  return `${base}-${suffix}.pdf`;
}
