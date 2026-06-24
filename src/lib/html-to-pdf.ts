import { classifyPdfError } from "./pdf-errors";

export type HtmlPdfOrientation = "portrait" | "landscape";
export type HtmlPdfMargin = "none" | "normal";

export type HtmlToPdfOptions = {
  orientation: HtmlPdfOrientation;
  margin: HtmlPdfMargin;
};

export type HtmlToPdfProgressPhase = "rendering" | "capturing" | "building";

const A4_PORTRAIT = { width: 595.28, height: 841.89 };
const A4_LANDSCAPE = { width: 841.89, height: 595.28 };

const SANDBOX_IFRAME_ID = "joinmypdf-html-to-pdf-iframe";

const DEFAULT_HTML_SAMPLE = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>HTML to PDF Preview</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 24px; background: #ffffff; color: #0a0a0a; }
      .card { background: white; border: 1px solid #d4d4d4; border-radius: 12px; padding: 20px; }
      h1 { margin: 0 0 12px; font-size: 26px; }
      p { margin: 0 0 12px; line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #d4d4d4; padding: 8px 10px; text-align: left; }
      th { background: #e5e5e5; }
      code { background: #eef2ff; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, Menlo, monospace; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>HTML to PDF Converter</h1>
      <p>Render your own layouts with <strong>tables</strong>, <em>typography</em>, and custom classes.</p>
      <p>Inline code: <code>const privacy = "client-side only"</code></p>
      <table>
        <thead><tr><th>Section</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Layout</td><td>Ready</td></tr>
          <tr><td>Pagination</td><td>A4 sliced</td></tr>
        </tbody>
      </table>
    </div>
  </body>
</html>`;

function isHtmlLike(input: string): boolean {
  const value = input.trim().toLowerCase();
  return value.includes("<html") || value.includes("<body") || value.includes("<div") || value.includes("<p");
}

function ensureHtmlDocument(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Add HTML code or upload a .html file first.");
  if (isHtmlLike(trimmed)) return trimmed;
  return `<!doctype html><html><head><meta charset="utf-8" /></head><body>${trimmed}</body></html>`;
}

function pageSizeForOrientation(orientation: HtmlPdfOrientation) {
  return orientation === "landscape" ? A4_LANDSCAPE : A4_PORTRAIT;
}

function marginPt(value: HtmlPdfMargin): number {
  return value === "none" ? 0 : 28;
}

async function waitForImages(root: Document): Promise<void> {
  const images = Array.from(root.images || []);
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

async function createSandboxFrame(html: string): Promise<HTMLIFrameElement> {
  const existing = document.getElementById(SANDBOX_IFRAME_ID);
  existing?.remove();

  const frame = document.createElement("iframe");
  frame.id = SANDBOX_IFRAME_ID;
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.left = "-20000px";
  frame.style.top = "0";
  frame.style.width = "1280px";
  frame.style.height = "1px";
  frame.style.opacity = "0";
  frame.style.pointerEvents = "none";
  frame.style.border = "0";
  frame.sandbox.add("allow-same-origin");
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) throw new Error("Could not initialize the HTML sandbox.");

  doc.open();
  doc.write(html);
  doc.close();

  await new Promise<void>((resolve) => {
    if (frame.contentDocument?.readyState === "complete") {
      resolve();
      return;
    }
    frame.addEventListener("load", () => resolve(), { once: true });
    window.setTimeout(() => resolve(), 500);
  });

  if (!frame.contentDocument) throw new Error("Could not read rendered HTML content.");
  await waitForImages(frame.contentDocument);

  const body = frame.contentDocument.body;
  if (!body) throw new Error("The HTML file does not contain a body element.");

  const htmlEl = frame.contentDocument.documentElement;
  const fullHeight = Math.max(
    body.scrollHeight,
    body.offsetHeight,
    htmlEl?.scrollHeight || 0,
    htmlEl?.offsetHeight || 0,
  );
  frame.style.height = `${Math.max(200, fullHeight + 16)}px`;
  return frame;
}

export async function readHtmlFile(file: File): Promise<string> {
  if (!/\.html?$/i.test(file.name) && !/text\/html/i.test(file.type)) {
    throw new Error("Please upload a .html file.");
  }
  const text = await file.text();
  if (!text.trim()) {
    throw new Error("That HTML file is empty.");
  }
  return text;
}

export async function renderHtmlPreview(htmlInput: string): Promise<string> {
  const html = ensureHtmlDocument(htmlInput);
  const frame = await createSandboxFrame(html);
  try {
    return frame.contentDocument?.documentElement.outerHTML || html;
  } finally {
    frame.remove();
  }
}

export async function convertHtmlToPdf(
  htmlInput: string,
  options: HtmlToPdfOptions,
  onProgress?: (phase: HtmlToPdfProgressPhase) => void,
): Promise<Blob> {
  onProgress?.("rendering");

  const html = ensureHtmlDocument(htmlInput);

  let frame: HTMLIFrameElement | null = null;
  try {
    frame = await createSandboxFrame(html);
    const rootDoc = frame.contentDocument;
    const body = rootDoc?.body;
    if (!rootDoc || !body) {
      throw new Error("Could not render the provided HTML.");
    }

    onProgress?.("capturing");
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(body, {
      scale: 2,
      useCORS: true,
      backgroundColor: rootDoc.defaultView?.getComputedStyle(body).backgroundColor || "#ffffff",
      logging: false,
      windowWidth: Math.max(1280, body.scrollWidth),
      windowHeight: Math.max(800, body.scrollHeight),
    });

    onProgress?.("building");
    const size = pageSizeForOrientation(options.orientation);
    const margin = marginPt(options.margin);
    const contentWidth = size.width - margin * 2;
    const contentHeight = size.height - margin * 2;

    const pdf = new jsPDF({
      orientation: options.orientation === "landscape" ? "l" : "p",
      unit: "pt",
      format: "a4",
    });

    const imageHeight = (canvas.height * contentWidth) / canvas.width;
    const imageData = canvas.toDataURL("image/png", 1);

    let offsetY = 0;
    pdf.addImage(imageData, "PNG", margin, margin + offsetY, contentWidth, imageHeight);
    let remaining = imageHeight - contentHeight;

    while (remaining > 0) {
      offsetY -= contentHeight;
      pdf.addPage();
      pdf.addImage(imageData, "PNG", margin, margin + offsetY, contentWidth, imageHeight);
      remaining -= contentHeight;
    }

    return pdf.output("blob");
  } catch (error) {
    throw classifyPdfError(error);
  } finally {
    frame?.remove();
  }
}

export function htmlToPdfOutputName(file: File | null): string {
  if (!file) return "joinmypdf-html-export.pdf";
  const base = file.name.replace(/\.html?$/i, "") || "document";
  const safe = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
  return `joinmypdf-${safe || "document"}.pdf`;
}

export { DEFAULT_HTML_SAMPLE };
