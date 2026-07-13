/**
 * PDF Editor export via html2canvas + jsPDF.
 * Captures visual layout (including correct RTL/Hebrew) instead of re-drawing with pdf-lib.
 */

export type SnapshotExportPage = {
  pageIndex: number;
  width: number;
  height: number;
  html: string;
};

function containsHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

function waitNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function buildCaptureHost(html: string, widthPt: number, heightPt: number): HTMLElement {
  const host = document.createElement("div");
  host.id = "tiptap-editor-container-export";
  host.setAttribute("data-pdf-editor-export", "true");

  const pxPerPt = 96 / 72;
  const widthPx = Math.round(widthPt * pxPerPt);
  const heightPx = Math.round(heightPt * pxPerPt);
  const marginPx = Math.round(Math.max(36, Math.min(widthPt, heightPt) * 0.08) * pxPerPt);
  const plain = html.replace(/<[^>]+>/g, " ");
  const rtl = containsHebrew(plain);

  host.style.cssText = [
    "position:fixed",
    "left:-12000px",
    "top:0",
    `width:${widthPx}px`,
    `height:${heightPx}px`,
    `padding:${marginPx}px`,
    "box-sizing:border-box",
    "overflow:hidden",
    "background:#ffffff",
    "color:#111111",
    'font-family:Arial,"Noto Sans Hebrew","DejaVu Sans",Helvetica,sans-serif',
    "font-size:14.67px",
    "line-height:1.5",
    `direction:${rtl ? "rtl" : "ltr"}`,
    `text-align:${rtl ? "right" : "left"}`,
    "unicode-bidi:plaintext",
  ].join(";");

  const style = document.createElement("style");
  style.textContent = `
    [data-pdf-editor-export] p { margin: 0 0 0.75em; }
    [data-pdf-editor-export] h1,
    [data-pdf-editor-export] h2,
    [data-pdf-editor-export] h3 {
      margin: 0 0 0.65em;
      font-weight: 600;
      color: #111;
    }
    [data-pdf-editor-export] h1 { font-size: 24px; }
    [data-pdf-editor-export] h2 { font-size: 20px; }
    [data-pdf-editor-export] h3 { font-size: 17px; }
    [data-pdf-editor-export] ul,
    [data-pdf-editor-export] ol {
      margin: 0 0 0.75em;
      padding-inline-start: 1.25em;
    }
    [data-pdf-editor-export] strong { font-weight: 700; }
    [data-pdf-editor-export] em { font-style: italic; }
    [data-pdf-editor-export] u { text-decoration: underline; }
  `;

  const inner = document.createElement("div");
  inner.id = "tiptap-editor-container";
  inner.className = "pdf-editor__export-capture";
  inner.dir = rtl ? "rtl" : "auto";
  inner.innerHTML = html?.trim() ? html : "<p></p>";

  host.appendChild(style);
  host.appendChild(inner);
  document.body.appendChild(host);
  return host;
}

/**
 * Build a multi-page PDF by snapshotting each page's HTML with html2canvas,
 * then placing the image on a jsPDF page sized like the original PDF page.
 */
export async function exportPdfEditorViaHtmlSnapshot(
  pages: SnapshotExportPage[],
  onProgress?: (percent: number, status: "capturing" | "building" | "saving") => void,
): Promise<Blob> {
  if (!pages.length) {
    throw new Error("No pages to export.");
  }

  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const sorted = [...pages].sort((a, b) => a.pageIndex - b.pageIndex);
  let pdf: import("jspdf").jsPDF | null = null;

  try {
    for (let i = 0; i < sorted.length; i += 1) {
      const page = sorted[i]!;
      const width = Math.max(200, page.width || 612);
      const height = Math.max(200, page.height || 792);
      const orientation = width >= height ? "l" : "p";

      onProgress?.(
        Math.min(90, Math.round(((i + 0.2) / sorted.length) * 90)),
        "capturing",
      );

      const host = buildCaptureHost(page.html || "<p></p>", width, height);
      try {
        await waitNextFrame();

        const canvas = await html2canvas(host, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: host.offsetWidth,
          height: host.offsetHeight,
          windowWidth: host.offsetWidth,
          windowHeight: host.offsetHeight,
        });

        onProgress?.(
          Math.min(92, Math.round(((i + 0.7) / sorted.length) * 90)),
          "building",
        );

        const imgData = canvas.toDataURL("image/png", 1);

        if (!pdf) {
          pdf = new jsPDF({
            orientation,
            unit: "pt",
            format: [width, height],
            compress: true,
          });
        } else {
          pdf.addPage([width, height], orientation);
        }

        // Cover the full page — host was sized to the same aspect.
        pdf.addImage(imgData, "PNG", 0, 0, width, height, undefined, "FAST");
      } finally {
        host.remove();
      }
    }

    if (!pdf) {
      throw new Error("PDF export produced no pages.");
    }

    onProgress?.(96, "saving");
    return pdf.output("blob");
  } catch (error) {
    throw error instanceof Error ? error : new Error("Snapshot PDF export failed.");
  }
}
