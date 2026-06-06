import { classifyPdfError } from "./pdf-errors";
import { formatBytes } from "./pdf-to-word";

export { formatBytes };

const PPTX_RENDER_ROOT_ID = "joinmypdf-powerpoint-to-pdf-render-root";
const A4_LANDSCAPE_WIDTH_PX = 1123;

export type PowerpointToPdfProgress = {
  phase: "parsing" | "rendering" | "building";
  currentSlide?: number;
  totalSlides?: number;
};

export type PowerpointMeta = {
  slideCount: number;
};

function isPptxBytes(bytes: Uint8Array, fileName: string): boolean {
  if (/\.pptx$/i.test(fileName)) return true;
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slideNumberFromPath(path: string): number {
  const match = /slide(\d+)\.xml$/i.exec(path);
  return match ? Number(match[1]) : 0;
}

function extractSlideParagraphs(xml: string): string[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const paragraphs: string[] = [];
  const pNodes = doc.getElementsByTagName("a:p");

  for (let i = 0; i < pNodes.length; i++) {
    const tNodes = pNodes[i].getElementsByTagName("a:t");
    let text = "";
    for (let j = 0; j < tNodes.length; j++) {
      text += tNodes[j].textContent || "";
    }
    const trimmed = text.replace(/\s+/g, " ").trim();
    if (trimmed) paragraphs.push(trimmed);
  }

  return paragraphs;
}

async function listSlideXmlPaths(arrayBuffer: ArrayBuffer): Promise<string[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(arrayBuffer);
  return Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
    .sort((a, b) => slideNumberFromPath(a) - slideNumberFromPath(b));
}

export async function readPowerpointMeta(file: File): Promise<PowerpointMeta> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (!isPptxBytes(bytes, file.name)) {
    throw new Error("Please upload a valid .pptx PowerPoint file.");
  }
  const slidePaths = await listSlideXmlPaths(arrayBuffer);
  if (!slidePaths.length) {
    throw new Error("No slides found in this presentation.");
  }
  return { slideCount: slidePaths.length };
}

function buildSlidesHtml(slides: { index: number; paragraphs: string[] }[]): string {
  return slides
    .map(({ index, paragraphs }) => {
      const body = paragraphs.length
        ? paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")
        : `<p class="empty">[No extractable text on this slide]</p>`;
      return `<section class="slide"><h2>Slide ${index}</h2><div class="slide-body">${body}</div></section>`;
    })
    .join("\n");
}

function buildRenderHost(html: string): HTMLElement {
  const existing = document.getElementById(PPTX_RENDER_ROOT_ID);
  existing?.remove();

  const host = document.createElement("div");
  host.id = PPTX_RENDER_ROOT_ID;
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = `${A4_LANDSCAPE_WIDTH_PX}px`;
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";

  const inner = document.createElement("div");
  inner.className = "joinmypdf-pptx-render";
  inner.style.width = `${A4_LANDSCAPE_WIDTH_PX}px`;
  inner.style.padding = "36px 44px";
  inner.style.boxSizing = "border-box";
  inner.style.fontFamily = 'Calibri, "Segoe UI", Arial, sans-serif';
  inner.style.background = "#ffffff";
  inner.style.color = "#0a0a0a";
  inner.innerHTML = html;

  const style = document.createElement("style");
  style.textContent = `
    .joinmypdf-pptx-render .slide + .slide { margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid #e5e5e5; }
    .joinmypdf-pptx-render h2 { margin: 0 0 0.85rem; font-size: 16pt; color: #171717; }
    .joinmypdf-pptx-render p { margin: 0 0 0.55rem; font-size: 12pt; line-height: 1.45; }
    .joinmypdf-pptx-render p.empty { color: #404040; font-style: italic; }
  `;

  host.appendChild(style);
  host.appendChild(inner);
  document.body.appendChild(host);
  return inner;
}

async function htmlElementToLandscapePdfBlob(element: HTMLElement): Promise<Blob> {
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

  const pdf = new jsPDF({ orientation: "l", unit: "pt", format: "a4" });
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

export async function convertPptxToPdf(
  file: File,
  onProgress?: (progress: PowerpointToPdfProgress) => void,
): Promise<Blob> {
  if (file.size === 0) {
    throw new Error("That file is empty. Choose another presentation.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (!isPptxBytes(bytes, file.name)) {
    throw new Error("Please upload a valid .pptx PowerPoint file.");
  }

  onProgress?.({ phase: "parsing" });

  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slidePaths = await listSlideXmlPaths(arrayBuffer);

    const slides: { index: number; paragraphs: string[] }[] = [];
    for (let i = 0; i < slidePaths.length; i++) {
      onProgress?.({ phase: "parsing", currentSlide: i + 1, totalSlides: slidePaths.length });
      const xml = await zip.file(slidePaths[i])?.async("text");
      if (!xml) continue;
      slides.push({ index: i + 1, paragraphs: extractSlideParagraphs(xml) });
    }

    if (!slides.length) {
      throw new Error("Could not read slides from this presentation.");
    }

    onProgress?.({ phase: "rendering", totalSlides: slides.length });
    const renderRoot = buildRenderHost(buildSlidesHtml(slides));

    try {
      onProgress?.({ phase: "building", totalSlides: slides.length });
      return await htmlElementToLandscapePdfBlob(renderRoot);
    } finally {
      renderRoot.parentElement?.remove();
    }
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function powerpointToPdfOutputName(file: File): string {
  const base = file.name.replace(/\.pptx$/i, "") || "presentation";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "presentation";
  return `joinmypdf-${slug}.pdf`;
}
