import JSZip from "jszip";
import { PDFDocument } from "pdf-lib-with-encrypt";
import { classifyPdfError } from "./pdf-errors";

const RENDER_SCALE = 2;
const XPS_NS = "http://schemas.microsoft.com/xps/2005/06";
const REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships";

export type PdfToXpsProgress = {
  phase: "loading" | "rendering" | "packaging";
  currentPage: number;
  totalPages: number;
};

async function setupPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

async function loadDocument(source: Uint8Array, password?: string): Promise<PDFDocument> {
  const loadOptions = password?.trim() ? { password: password.trim() } : {};
  try {
    return await PDFDocument.load(source, loadOptions);
  } catch (error) {
    throw classifyPdfError(error);
  }
}

function pdfPointsToXpsUnits(points: number): number {
  return (points * 96) / 72;
}

function fmtUnits(value: number): string {
  return value.toFixed(4);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildFixedPage(width: number, height: number, imagePath: string): string {
  const w = fmtUnits(width);
  const h = fmtUnits(height);
  const figures = `M 0,0 L ${w},0 L ${w},${h} L 0,${h} z`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<FixedPage Width="${w}" Height="${h}" xmlns="${XPS_NS}" xml:lang="en-US">
  <Canvas xmlns="${XPS_NS}">
    <Canvas.Clip>
      <PathGeometry Figures="${figures}"/>
    </Canvas.Clip>
    <Path>
      <Path.Fill>
        <ImageBrush TileMode="None" Viewbox="0,0,${w},${h}" Viewport="0,0,${w},${h}" ViewboxUnits="Absolute" ViewportUnits="Absolute">
          <ImageBrush.ImageSource>${imagePath}</ImageBrush.ImageSource>
        </ImageBrush>
      </Path.Fill>
      <Path.Data>
        <PathGeometry Figures="${figures}"/>
      </Path.Data>
    </Path>
  </Canvas>
</FixedPage>`;
}

function buildPageRels(imageName: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="${REL_NS}">
  <Relationship Id="rId1" Type="http://schemas.microsoft.com/xps/2005/06/required-resource" Target="../Images/${imageName}"/>
</Relationships>`;
}

async function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Failed to encode page image."))),
      "image/png",
    );
  });
  return new Uint8Array(await blob.arrayBuffer());
}

type XpsPage = {
  pageNumber: number;
  width: number;
  height: number;
  pngBytes: Uint8Array;
};

async function renderPdfPages(
  source: Uint8Array,
  sourceDoc: PDFDocument,
  password: string | undefined,
  onProgress?: (progress: PdfToXpsProgress) => void,
): Promise<XpsPage[]> {
  const pdfjs = await setupPdfJs();
  const pdfJsDoc = await pdfjs
    .getDocument(password ? { data: source.slice(), password } : { data: source.slice() })
    .promise;

  const totalPages = sourceDoc.getPageCount();
  const pages: XpsPage[] = [];

  for (let i = 0; i < totalPages; i += 1) {
    onProgress?.({ phase: "rendering", currentPage: i + 1, totalPages });

    const { width, height } = sourceDoc.getPage(i).getSize();
    const pdfPage = await pdfJsDoc.getPage(i + 1);
    const viewport = pdfPage.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported in this browser.");

    await pdfPage.render({ canvasContext: ctx, viewport, canvas } as never).promise;
    const pngBytes = await canvasToPng(canvas);

    pages.push({
      pageNumber: i + 1,
      width: pdfPointsToXpsUnits(width),
      height: pdfPointsToXpsUnits(height),
      pngBytes,
    });
  }

  return pages;
}

async function buildXpsPackage(title: string, pages: XpsPage[]): Promise<Blob> {
  const zip = new JSZip();
  const safeTitle = escapeXml(title);

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="fdseq" ContentType="application/vnd.ms-package.xps-fixeddocumentsequence+xml"/>
  <Default Extension="fpage" ContentType="application/vnd.ms-package.xps-fixedpage+xml"/>
  <Default Extension="fdoc" ContentType="application/vnd.ms-package.xps-fixeddocument+xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`,
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="${REL_NS}">
  <Relationship Id="rId1" Type="http://schemas.microsoft.com/xps/2005/06/fixedrepresentation" Target="/FixedDocumentSequence.fdseq"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="/docProps/core.xml"/>
</Relationships>`,
  );

  zip.file(
    "docProps/core.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<coreProperties xmlns="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${safeTitle}</dc:title>
  <dc:creator>JoinMyPDF</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
</coreProperties>`,
  );

  zip.file(
    "FixedDocumentSequence.fdseq",
    `<?xml version="1.0" encoding="UTF-8"?>
<FixedDocumentSequence xmlns="${XPS_NS}">
  <DocumentReference Source="Documents/1/FixedDocument.fdoc"/>
</FixedDocumentSequence>`,
  );

  const pageRefs = pages
    .map((page) => `  <PageContent Source="Pages/${page.pageNumber}.fpage"/>`)
    .join("\n");

  zip.file(
    "Documents/1/FixedDocument.fdoc",
    `<?xml version="1.0" encoding="UTF-8"?>
<FixedDocument xmlns="${XPS_NS}">
${pageRefs}
</FixedDocument>`,
  );

  zip.file("Documents/1/_rels/FixedDocument.fdoc.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="${REL_NS}"></Relationships>`);

  for (const page of pages) {
    const imageName = `${page.pageNumber}.png`;
    zip.file(`Documents/1/Images/${imageName}`, page.pngBytes);
    zip.file(`Documents/1/Pages/${page.pageNumber}.fpage`, buildFixedPage(page.width, page.height, `../Images/${imageName}`));
    zip.file(`Documents/1/Pages/_rels/${page.pageNumber}.fpage.rels`, buildPageRels(imageName));
  }

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.ms-xpsdocument",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

/** Convert a PDF to an XPS package (OPC/ZIP) for Windows-centric document workflows. */
export async function convertPdfToXps(
  file: File,
  onProgress?: (progress: PdfToXpsProgress) => void,
  options?: { password?: string },
): Promise<Blob> {
  const password = options?.password?.trim() || undefined;
  onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });

  try {
    const source = new Uint8Array(await file.arrayBuffer());
    const sourceDoc = await loadDocument(source, password);
    if (sourceDoc.isEncrypted && !password) {
      throw new Error("This PDF is password-protected. Enter the password to convert it to XPS.");
    }

    const pages = await renderPdfPages(source, sourceDoc, password, onProgress);
    const title = file.name.replace(/\.pdf$/i, "") || "Document";

    onProgress?.({ phase: "packaging", currentPage: pages.length, totalPages: pages.length });
    return buildXpsPackage(title, pages);
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function pdfToXpsOutputName(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  return `joinmypdf-${slug}.xps`;
}
