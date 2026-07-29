import PostalMime, { type Address, type Attachment, type Email } from "postal-mime";
import { classifyPdfError } from "./pdf-errors";

export type EmlPdfOrientation = "portrait" | "landscape";
export type EmlPdfPageSize = "a4" | "letter";
export type EmlPdfFontSize = "small" | "medium" | "large";

export type EmlToPdfOptions = {
  includeHeaders: boolean;
  includeAttachmentsList: boolean;
  orientation: EmlPdfOrientation;
  pageSize: EmlPdfPageSize;
  fontSize: EmlPdfFontSize;
};

export type EmlToPdfProgressPhase = "parsing" | "rendering" | "building";

export type ParsedEmlMessage = {
  from: string;
  to: string;
  cc: string;
  subject: string;
  date: string;
  bodyHtml: string;
  bodyText: string;
  attachmentNames: string[];
};

const RENDER_ROOT_ID = "joinmypdf-eml-to-pdf-render-root";

const FONT_SIZE_PT: Record<EmlPdfFontSize, number> = {
  small: 10,
  medium: 12,
  large: 14,
};

function formatAddress(entry: Address | undefined): string {
  if (!entry) return "";
  if (entry.group) {
    const members = entry.group.map(formatAddress).filter(Boolean).join(", ");
    return entry.name ? `${entry.name}: ${members}` : members;
  }
  if (entry.name && entry.address) return `${entry.name} <${entry.address}>`;
  return entry.address || entry.name || "";
}

function formatAddressList(list: Address[] | undefined): string {
  if (!list?.length) return "";
  return list.map(formatAddress).filter(Boolean).join(", ");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtmlParagraphs(text: string): string {
  const escaped = escapeHtml(text.trim());
  if (!escaped) return "<p></p>";
  return escaped
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function attachmentToDataUrl(part: Attachment): string | null {
  const mime = part.mimeType || "application/octet-stream";
  const content = part.content;
  if (!content) return null;

  if (typeof content === "string") {
    if (part.encoding === "base64") return `data:${mime};base64,${content.replace(/\s+/g, "")}`;
    try {
      return `data:${mime};base64,${btoa(unescape(encodeURIComponent(content)))}`;
    } catch {
      return null;
    }
  }

  const bytes =
    content instanceof ArrayBuffer
      ? new Uint8Array(content)
      : content instanceof Uint8Array
        ? content
        : null;
  if (!bytes) return null;

  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

function buildCidMap(attachments: Attachment[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of attachments || []) {
    const rawId = part.contentId?.replace(/^<|>$/g, "").trim();
    if (!rawId) continue;
    const dataUrl = attachmentToDataUrl(part);
    if (!dataUrl) continue;
    map.set(rawId.toLowerCase(), dataUrl);
  }
  return map;
}

function resolveCidReferences(html: string, cidMap: Map<string, string>): string {
  if (!cidMap.size) return html;
  return html.replace(
    /(src|href|background)\s*=\s*(["']?)cid:([^"'>\s]+)\2/gi,
    (full, attr: string, quote: string, cid: string) => {
      const key = cid.replace(/^<|>$/g, "").trim().toLowerCase();
      const dataUrl = cidMap.get(key);
      if (!dataUrl) return full;
      const q = quote || '"';
      return `${attr}=${q}${dataUrl}${q}`;
    },
  );
}

/**
 * Email HTML is often a full document. Nesting <html>/<body> inside our sheet
 * drops most of the message in browsers — extract body + head styles instead.
 */
function extractEmailDocumentParts(html: string): { styles: string; body: string } {
  const trimmed = html.trim();
  if (typeof document === "undefined") {
    const styleMatches = [...trimmed.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(
      (m) => m[1] || "",
    );
    const bodyMatch = trimmed.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
    return {
      styles: styleMatches.join("\n"),
      body: bodyMatch?.[1]?.trim() || trimmed.replace(/<\/?(html|head|meta|link|title)\b[^>]*>/gi, ""),
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, "text/html");
  const styles = Array.from(doc.querySelectorAll("style"))
    .map((node) => node.textContent || "")
    .join("\n");
  const body = doc.body?.innerHTML?.trim() || trimmed;
  return { styles, body };
}

function sanitizeBodyFragment(html: string): string {
  if (typeof document === "undefined") {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  }

  const template = document.createElement("template");
  template.innerHTML = html;
  template.content
    .querySelectorAll("script, iframe, object, embed, link[rel='import'], base")
    .forEach((node) => node.remove());

  template.content.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || ((name === "href" || name === "src") && /^\s*javascript:/i.test(attr.value))) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return template.innerHTML;
}

function prepareBodyHtml(rawHtml: string | undefined, rawText: string | undefined, cidMap: Map<string, string>): string {
  if (rawHtml?.trim()) {
    const { styles, body } = extractEmailDocumentParts(rawHtml);
    const withCid = resolveCidReferences(body, cidMap);
    const safeBody = sanitizeBodyFragment(withCid);
    const safeStyles = styles
      ? `<style type="text/css">${styles.replace(/<\/style/gi, "<\\/style")}</style>`
      : "";
    return `${safeStyles}${safeBody}`;
  }
  return textToHtmlParagraphs(rawText || "");
}

export function emailToParsedMessage(email: Email): ParsedEmlMessage {
  const cidMap = buildCidMap(email.attachments);
  const bodyHtml = prepareBodyHtml(email.html, email.text, cidMap);
  const attachmentNames = (email.attachments || [])
    .filter((part) => {
      if (part.related) return false;
      if (part.disposition === "inline" && part.contentId && !part.filename) return false;
      return Boolean(part.filename) || part.disposition === "attachment";
    })
    .map((part) => part.filename || "attachment")
    .filter(Boolean);

  return {
    from: formatAddress(email.from) || "(unknown sender)",
    to: formatAddressList(email.to) || "(no recipients)",
    cc: formatAddressList(email.cc),
    subject: email.subject?.trim() || "(no subject)",
    date: email.date ? new Date(email.date).toLocaleString() : "",
    bodyHtml,
    bodyText: email.text?.trim() || "",
    attachmentNames,
  };
}

export async function parseEmlFile(file: File): Promise<ParsedEmlMessage> {
  if (!/\.eml$/i.test(file.name) && !/message\/rfc822/i.test(file.type)) {
    throw new Error("Please upload a .eml email file.");
  }
  if (file.size === 0) {
    throw new Error("That file is empty.");
  }

  const buffer = await file.arrayBuffer();
  const email = await PostalMime.parse(buffer);
  return emailToParsedMessage(email);
}

function buildEmailDocumentHtml(message: ParsedEmlMessage, options: EmlToPdfOptions): string {
  const fontPt = FONT_SIZE_PT[options.fontSize];
  const headers = options.includeHeaders
    ? `
      <header class="eml-headers">
        <div><span class="eml-label">From</span><span class="eml-value">${escapeHtml(message.from)}</span></div>
        <div><span class="eml-label">To</span><span class="eml-value">${escapeHtml(message.to)}</span></div>
        ${
          message.cc
            ? `<div><span class="eml-label">Cc</span><span class="eml-value">${escapeHtml(message.cc)}</span></div>`
            : ""
        }
        <div><span class="eml-label">Subject</span><span class="eml-value eml-subject">${escapeHtml(message.subject)}</span></div>
        ${
          message.date
            ? `<div><span class="eml-label">Date</span><span class="eml-value">${escapeHtml(message.date)}</span></div>`
            : ""
        }
      </header>`
    : `<h1 class="eml-title-only">${escapeHtml(message.subject)}</h1>`;

  const attachments =
    options.includeAttachmentsList && message.attachmentNames.length
      ? `<section class="eml-attachments"><strong>Attachments</strong><ul>${message.attachmentNames
          .map((name) => `<li>${escapeHtml(name)}</li>`)
          .join("")}</ul></section>`
      : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #111827;
        font-family: "Segoe UI", Arial, Helvetica, sans-serif;
        font-size: ${fontPt}pt;
        line-height: 1.55;
      }
      .eml-sheet { padding: 28px 32px; box-sizing: border-box; width: 100%; }
      .eml-headers {
        display: grid;
        gap: 0.45rem;
        margin: 0 0 1.25rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #d4d4d4;
      }
      .eml-headers > div { display: grid; grid-template-columns: 5.5rem 1fr; gap: 0.5rem; }
      .eml-label { font-weight: 700; color: #525252; }
      .eml-value { word-break: break-word; }
      .eml-subject { font-weight: 700; font-size: 1.15em; color: #0a0a0a; }
      .eml-title-only { margin: 0 0 1rem; font-size: 1.35em; }
      .eml-body { overflow-wrap: anywhere; word-break: break-word; }
      .eml-body img { max-width: 100% !important; height: auto !important; }
      .eml-body table { border-collapse: collapse; max-width: 100% !important; width: auto !important; }
      .eml-body td, .eml-body th { max-width: 100%; }
      .eml-body pre, .eml-body code { white-space: pre-wrap; word-break: break-word; }
      .eml-attachments { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e5e5; }
      .eml-attachments ul { margin: 0.4rem 0 0; padding-left: 1.25rem; }
    </style>
  </head>
  <body>
    <article class="eml-sheet">
      ${headers}
      <div class="eml-body">${message.bodyHtml || "<p></p>"}</div>
      ${attachments}
    </article>
  </body>
</html>`;
}

function buildRenderHost(html: string, contentWidthPx: number): HTMLElement {
  const existing = document.getElementById(RENDER_ROOT_ID);
  existing?.remove();

  const host = document.createElement("div");
  host.id = RENDER_ROOT_ID;
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-12000px";
  host.style.top = "0";
  host.style.width = `${contentWidthPx}px`;
  host.style.background = "#ffffff";
  host.style.color = "#111827";
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";

  const frame = document.createElement("iframe");
  frame.style.width = `${contentWidthPx}px`;
  frame.style.border = "0";
  frame.style.background = "#ffffff";
  host.appendChild(frame);
  document.body.appendChild(host);

  const doc = frame.contentDocument;
  if (!doc) throw new Error("Could not initialize the email render sandbox.");
  doc.open();
  doc.write(html);
  doc.close();

  const body = doc.body;
  if (!body) throw new Error("Could not render email content.");
  const height = Math.max(body.scrollHeight, body.offsetHeight, doc.documentElement?.scrollHeight || 0, 200);
  frame.style.height = `${height}px`;
  return body;
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
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

async function elementToPdfBlob(
  element: HTMLElement,
  options: Pick<EmlToPdfOptions, "orientation" | "pageSize">,
): Promise<Blob> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const pdf = new jsPDF({
    orientation: options.orientation === "landscape" ? "l" : "p",
    unit: "pt",
    format: options.pageSize,
  });
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

export function buildEmlPreviewHtml(message: ParsedEmlMessage, options: EmlToPdfOptions): string {
  return buildEmailDocumentHtml(message, options);
}

export async function convertEmlMessageToPdf(
  message: ParsedEmlMessage,
  options: EmlToPdfOptions,
  onProgress?: (phase: EmlToPdfProgressPhase) => void,
): Promise<Blob> {
  onProgress?.("rendering");
  const html = buildEmailDocumentHtml(message, options);
  const contentWidth = options.orientation === "landscape" ? 1100 : 794;
  const body = buildRenderHost(html, contentWidth);
  await waitForImages(body);
  // Allow layout/styles to settle after CID images load.
  await new Promise<void>((resolve) => window.setTimeout(resolve, 50));

  try {
    onProgress?.("building");
    return await elementToPdfBlob(body, options);
  } catch (error) {
    throw classifyPdfError(error);
  } finally {
    document.getElementById(RENDER_ROOT_ID)?.remove();
  }
}

export async function convertEmlFileToPdf(
  file: File,
  options: EmlToPdfOptions,
  onProgress?: (phase: EmlToPdfProgressPhase) => void,
): Promise<Blob> {
  onProgress?.("parsing");
  const message = await parseEmlFile(file);
  return convertEmlMessageToPdf(message, options, onProgress);
}

export function emlToPdfOutputName(file: File, subject?: string): string {
  const base =
    subject
      ?.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || file.name.replace(/\.eml$/i, "") || "email";
  return `${base}.pdf`;
}

export const DEFAULT_EML_OPTIONS: EmlToPdfOptions = {
  includeHeaders: true,
  includeAttachmentsList: true,
  orientation: "portrait",
  pageSize: "a4",
  fontSize: "medium",
};
