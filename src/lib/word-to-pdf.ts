import { classifyPdfError } from "./pdf-errors";
import { formatBytes } from "./pdf-to-word";

export { formatBytes };

const DOCX_RENDER_ROOT_ID = "joinmypdf-word-to-pdf-render-root";
const A4_CONTENT_WIDTH_PX = 794;

export type WordToPdfProgress = {
  phase: "parsing" | "rendering" | "building";
};

function isDocxBytes(bytes: Uint8Array, fileName: string): boolean {
  if (/\.docx$/i.test(fileName)) return true;
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function stripHtmlToText(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, " ");
  const node = document.createElement("div");
  node.innerHTML = html;
  return (node.textContent || node.innerText || "").replace(/\s+/g, " ").trim();
}

function buildRenderHost(html: string): HTMLElement {
  const existing = document.getElementById(DOCX_RENDER_ROOT_ID);
  existing?.remove();

  const host = document.createElement("div");
  host.id = DOCX_RENDER_ROOT_ID;
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = `${A4_CONTENT_WIDTH_PX}px`;
  host.style.background = "#ffffff";
  host.style.color = "#111827";
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";

  const inner = document.createElement("div");
  inner.className = "joinmypdf-docx-render";
  inner.style.width = `${A4_CONTENT_WIDTH_PX}px`;
  inner.style.padding = "48px 56px";
  inner.style.boxSizing = "border-box";
  inner.style.fontFamily = 'Georgia, "Times New Roman", serif';
  inner.style.fontSize = "12pt";
  inner.style.lineHeight = "1.55";
  inner.style.background = "#ffffff";
  inner.style.color = "#111827";
  inner.innerHTML = html;

  const style = document.createElement("style");
  style.textContent = `
    .joinmypdf-docx-render p { margin: 0 0 0.85em; }
    .joinmypdf-docx-render h1 { font-size: 1.75em; margin: 0 0 0.6em; font-weight: 700; }
    .joinmypdf-docx-render h2 { font-size: 1.35em; margin: 1em 0 0.5em; font-weight: 700; }
    .joinmypdf-docx-render h3 { font-size: 1.15em; margin: 0.85em 0 0.45em; font-weight: 700; }
    .joinmypdf-docx-render ul, .joinmypdf-docx-render ol { margin: 0 0 0.85em 1.25em; padding: 0; }
    .joinmypdf-docx-render table { border-collapse: collapse; width: 100%; margin: 0 0 1em; }
    .joinmypdf-docx-render th, .joinmypdf-docx-render td { border: 1px solid #d4d4d4; padding: 6px 8px; vertical-align: top; }
    .joinmypdf-docx-render img { max-width: 100%; height: auto; }
  `;

  host.appendChild(style);
  host.appendChild(inner);
  document.body.appendChild(host);
  return inner;
}

async function htmlElementToPdfBlob(element: HTMLElement): Promise<Blob> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png", 1);

  let offsetY = 0;
  pdf.addImage(imgData, "PNG", 0, offsetY, imgWidth, imgHeight);
  let remaining = imgHeight - pageHeight;

  while (remaining > 0) {
    offsetY -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, offsetY, imgWidth, imgHeight);
    remaining -= pageHeight;
  }

  return pdf.output("blob");
}

export async function convertDocxToPdf(
  file: File,
  onProgress?: (progress: WordToPdfProgress) => void,
): Promise<Blob> {
  if (file.size === 0) {
    throw new Error("That file is empty. Choose another Word document.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (!isDocxBytes(bytes, file.name)) {
    throw new Error("Please upload a valid .docx Word document.");
  }

  onProgress?.({ phase: "parsing" });

  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value?.trim() ?? "";
    const plain = stripHtmlToText(html);

    if (!plain) {
      throw new Error("This document appears empty or could not be parsed.");
    }

    onProgress?.({ phase: "rendering" });
    const renderRoot = buildRenderHost(html);

    try {
      onProgress?.({ phase: "building" });
      return await htmlElementToPdfBlob(renderRoot);
    } finally {
      renderRoot.parentElement?.remove();
    }
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function wordToPdfOutputName(file: File): string {
  const base = file.name.replace(/\.docx$/i, "") || "document";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  return `joinmypdf-${slug}.pdf`;
}
