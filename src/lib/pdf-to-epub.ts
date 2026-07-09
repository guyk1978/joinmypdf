import JSZip from "jszip";
import { classifyPdfError } from "./pdf-errors";
import { setupPdfJs } from "./pdf-text-extract";
import {
  extractPdfStructuredPages,
  type PdfHtmlBlock,
  type PdfToHtmlProgress,
} from "./pdf-to-html";
import { createMobiFromHtml } from "./mobi-writer";

export type EbookOutputFormat = "epub" | "mobi";

export type PdfToEbookProgress = {
  phase: "loading" | "extracting" | "rendering" | "packaging";
  currentPage: number;
  totalPages: number;
};

export type PdfToEbookOptions = {
  format: EbookOutputFormat;
};

type ChapterImage = {
  id: string;
  href: string;
  bytes: Uint8Array;
  mediaType: string;
};

type EbookChapter = {
  id: string;
  title: string;
  htmlBody: string;
  images: ChapterImage[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(value: string): string {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function renderBlock(block: PdfHtmlBlock): string {
  switch (block.type) {
    case "heading": {
      const tag = block.level === 2 ? "h2" : "h3";
      return `<${tag}>${escapeHtml(block.text)}</${tag}>`;
    }
    case "paragraph":
      return `<p>${escapeHtml(block.text)}</p>`;
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      return `<${tag}>${items}</${tag}>`;
    }
    default:
      return "";
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

async function renderPageJpeg(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof setupPdfJs>>["getDocument"]>["promise"]>["getPage"] extends (
    n: number,
  ) => infer R
    ? Awaited<R>
    : never,
): Promise<Uint8Array> {
  const viewport = page.getViewport({ scale: 1.35 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas for page rendering.");
  await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Could not render page image."))),
      "image/jpeg",
      0.82,
    );
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function randomUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function buildEpub(title: string, chapters: EbookChapter[]): Promise<Blob> {
  const zip = new JSZip();
  const bookId = `urn:uuid:${randomUuid()}`;
  const safeTitle = escapeXml(title);

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  const manifestItems = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `<item id="css" href="styles.css" media-type="text/css"/>`,
  ];
  const spineItems: string[] = [];
  const navItems: string[] = [];
  const ncxPoints: string[] = [];

  chapters.forEach((chapter, index) => {
    const fileName = `chapter-${index + 1}.xhtml`;
    manifestItems.push(
      `<item id="${chapter.id}" href="${fileName}" media-type="application/xhtml+xml"/>`,
    );
    spineItems.push(`<itemref idref="${chapter.id}"/>`);
    navItems.push(
      `<li><a href="${fileName}">${escapeHtml(chapter.title)}</a></li>`,
    );
    ncxPoints.push(
      `<navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
        <navLabel><text>${escapeXml(chapter.title)}</text></navLabel>
        <content src="${fileName}"/>
      </navPoint>`,
    );

    for (const image of chapter.images) {
      manifestItems.push(
        `<item id="${image.id}" href="${image.href}" media-type="${image.mediaType}"/>`,
      );
      zip.file(`OEBPS/${image.href}`, image.bytes);
    }

    zip.file(
      `OEBPS/${fileName}`,
      `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <title>${escapeHtml(chapter.title)}</title>
  <link rel="stylesheet" href="styles.css" type="text/css"/>
</head>
<body>
  <section epub:type="chapter">
    <h1>${escapeHtml(chapter.title)}</h1>
    ${chapter.htmlBody}
  </section>
</body>
</html>`,
    );
  });

  zip.file(
    "OEBPS/styles.css",
    `body { font-family: Georgia, "Times New Roman", serif; line-height: 1.6; margin: 0; }
h1, h2, h3 { line-height: 1.25; }
p { margin: 0 0 1em; }
img.page-image { display: block; width: 100%; height: auto; margin: 0 0 1em; }
.page-note { color: #737373; font-style: italic; }`,
  );

  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>${navItems.join("")}</ol>
  </nav>
</body>
</html>`,
  );

  zip.file(
    "OEBPS/toc.ncx",
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${safeTitle}</text></docTitle>
  <navMap>${ncxPoints.join("")}</navMap>
</ncx>`,
  );

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${bookId}</dc:identifier>
    <dc:title>${safeTitle}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>JoinMyPDF</dc:creator>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join("\n    ")}
  </spine>
</package>`,
  );

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
}

async function buildChaptersFromPdf(
  file: File,
  onProgress?: (progress: PdfToEbookProgress) => void,
): Promise<{ title: string; chapters: EbookChapter[] }> {
  const { title, pages } = await extractPdfStructuredPages(file, (progress) => {
    onProgress?.({
      phase: progress.phase === "building" ? "packaging" : progress.phase,
      currentPage: progress.currentPage,
      totalPages: progress.totalPages,
    });
  });

  const pdfjs = await setupPdfJs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDoc = await pdfjs.getDocument({ data: bytes }).promise;
  const chapters: EbookChapter[] = [];
  let hasContent = false;

  for (const page of pages) {
    onProgress?.({
      phase: "rendering",
      currentPage: page.pageNumber,
      totalPages: pages.length,
    });

    const images: ChapterImage[] = [];
    let htmlBody = page.blocks.map(renderBlock).join("\n");

    if (!page.blocks.length) {
      const pdfPage = await pdfDoc.getPage(page.pageNumber);
      const jpeg = await renderPageJpeg(pdfPage);
      const imageId = `img-page-${page.pageNumber}`;
      const href = `images/page-${page.pageNumber}.jpg`;
      images.push({ id: imageId, href, bytes: jpeg, mediaType: "image/jpeg" });
      htmlBody = `<p class="page-note">This page was exported as an image because no selectable text was detected.</p><img class="page-image" alt="Page ${page.pageNumber}" src="${href}"/>`;
      hasContent = true;
    } else {
      hasContent = true;
    }

    chapters.push({
      id: `chapter-${page.pageNumber}`,
      title: pages.length > 1 ? `Page ${page.pageNumber}` : title,
      htmlBody,
      images,
    });
  }

  if (!hasContent) {
    throw new Error(
      "No text or renderable pages found. This PDF may be empty or unsupported.",
    );
  }

  return { title, chapters };
}

function chaptersToMobiHtml(chapters: EbookChapter[]): string {
  return chapters
    .map((chapter) => {
      const imageHtml = chapter.images
        .map(
          (image) =>
            `<img alt="${escapeHtml(chapter.title)}" src="data:${image.mediaType};base64,${uint8ToBase64(image.bytes)}"/>`,
        )
        .join("");
      return `<h1>${escapeHtml(chapter.title)}</h1>${imageHtml}${chapter.htmlBody}<mbp:pagebreak/>`;
    })
    .join("");
}

export async function convertPdfToEbook(
  file: File,
  options: PdfToEbookOptions,
  onProgress?: (progress: PdfToEbookProgress) => void,
): Promise<Blob> {
  try {
    const { title, chapters } = await buildChaptersFromPdf(file, onProgress);
    onProgress?.({
      phase: "packaging",
      currentPage: chapters.length,
      totalPages: chapters.length,
    });

    if (options.format === "mobi") {
      const mobiBytes = createMobiFromHtml({
        title,
        author: "JoinMyPDF",
        html: chaptersToMobiHtml(chapters),
      });
      return new Blob([mobiBytes as BlobPart], { type: "application/x-mobipocket-ebook" });
    }

    return buildEpub(title, chapters);
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function pdfToEbookOutputName(file: File, format: EbookOutputFormat): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  return `joinmypdf-${slug}.${format}`;
}
