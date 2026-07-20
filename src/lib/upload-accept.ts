import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

export type UploadMediaKind = "pdf" | "image" | "video" | "audio" | "file";

const MIME_TO_FORMAT: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/jpg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
  "image/heic": "HEIC",
  "image/heif": "HEIF",
  "image/svg+xml": "SVG",
  "image/x-icon": "ICO",
  "image/vnd.microsoft.icon": "ICO",
  "image/bmp": "BMP",
  "image/tiff": "TIFF",
  "video/mp4": "MP4",
  "video/webm": "WEBM",
  "video/quicktime": "MOV",
  "video/x-matroska": "MKV",
  "video/x-msvideo": "AVI",
  "audio/mpeg": "MP3",
  "audio/mp3": "MP3",
  "audio/wav": "WAV",
  "audio/x-wav": "WAV",
  "audio/aac": "AAC",
  "audio/mp4": "M4A",
  "audio/x-m4a": "M4A",
  "audio/ogg": "OGG",
  "audio/flac": "FLAC",
  "text/csv": "CSV",
  "application/json": "JSON",
  "text/markdown": "MD",
  "text/html": "HTML",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
};

const EXT_TO_FORMAT: Record<string, string> = {
  pdf: "PDF",
  jpg: "JPG",
  jpeg: "JPG",
  png: "PNG",
  webp: "WebP",
  gif: "GIF",
  heic: "HEIC",
  heif: "HEIF",
  svg: "SVG",
  ico: "ICO",
  bmp: "BMP",
  tif: "TIFF",
  tiff: "TIFF",
  mp4: "MP4",
  webm: "WEBM",
  mov: "MOV",
  mkv: "MKV",
  avi: "AVI",
  mp3: "MP3",
  wav: "WAV",
  aac: "AAC",
  m4a: "M4A",
  ogg: "OGG",
  oga: "OGG",
  flac: "FLAC",
  csv: "CSV",
  json: "JSON",
  md: "MD",
  markdown: "MD",
  html: "HTML",
  htm: "HTML",
  doc: "DOC",
  docx: "DOCX",
  xls: "XLS",
  xlsx: "XLSX",
  ppt: "PPT",
  pptx: "PPTX",
  dxf: "DXF",
  dwg: "DWG",
  epub: "EPUB",
  pages: "PAGES",
  key: "KEY",
  numbers: "NUMBERS",
  odt: "ODT",
  ods: "ODS",
  odp: "ODP",
};

const FORMAT_TO_ACCEPT: Record<string, string> = {
  PDF: "application/pdf,.pdf",
  JPG: "image/jpeg,image/jpg,.jpg,.jpeg",
  JPEG: "image/jpeg,image/jpg,.jpg,.jpeg",
  PNG: "image/png,.png",
  WEBP: "image/webp,.webp",
  GIF: "image/gif,.gif",
  HEIC: "image/heic,.heic",
  HEIF: "image/heif,.heif",
  SVG: "image/svg+xml,.svg",
  ICO: "image/x-icon,.ico",
  BMP: "image/bmp,.bmp",
  TIFF: "image/tiff,.tif,.tiff",
  MP4: "video/mp4,.mp4",
  WEBM: "video/webm,.webm",
  MOV: "video/quicktime,.mov",
  MKV: "video/x-matroska,.mkv",
  AVI: "video/x-msvideo,.avi",
  MP3: "audio/mpeg,.mp3",
  WAV: "audio/wav,.wav",
  AAC: "audio/aac,.aac",
  M4A: "audio/mp4,.m4a",
  OGG: "audio/ogg,.ogg",
  FLAC: "audio/flac,.flac",
  CSV: "text/csv,.csv",
  JSON: "application/json,.json",
  MD: "text/markdown,.md",
  HTML: "text/html,.html,.htm",
  DOCX: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  DOC: ".doc,application/msword",
  XLSX: ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  PPTX: ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const IMAGE_FORMATS = new Set([
  "JPG",
  "JPEG",
  "PNG",
  "WEBP",
  "GIF",
  "HEIC",
  "HEIF",
  "SVG",
  "ICO",
  "BMP",
  "TIFF",
]);
const VIDEO_FORMATS = new Set(["MP4", "WEBM", "MOV", "MKV", "AVI"]);
const AUDIO_FORMATS = new Set(["MP3", "WAV", "AAC", "M4A", "OGG", "FLAC"]);

function normalizeFormatToken(raw: string): string | null {
  const token = raw.trim().toLowerCase();
  if (!token || token === "*" || token.endsWith("/*")) return null;

  if (token.includes("/")) {
    return MIME_TO_FORMAT[token] ?? null;
  }

  const ext = token.replace(/^\./, "");
  if (!ext) return null;
  return EXT_TO_FORMAT[ext] ?? ext.toUpperCase();
}

/** Parse an HTML `accept` attribute into display format labels (PDF, HEIC, …). */
export function formatsFromAcceptAttr(accept?: string | null): string[] {
  if (!accept?.trim()) return [];

  const seen = new Set<string>();
  const formats: string[] = [];

  for (const part of accept.split(",")) {
    const format = normalizeFormatToken(part);
    if (!format || seen.has(format)) continue;
    seen.add(format);
    formats.push(format);
  }

  return formats;
}

/** Build a reasonable `accept` attribute from display format labels. */
export function acceptAttrFromFormats(formats: string[]): string {
  const parts: string[] = [];
  const seen = new Set<string>();

  for (const format of formats) {
    const key = format.trim().toUpperCase();
    if (!key) continue;
    const mapped = FORMAT_TO_ACCEPT[key] ?? `.${key.toLowerCase()}`;
    for (const part of mapped.split(",")) {
      const token = part.trim();
      if (!token || seen.has(token)) continue;
      seen.add(token);
      parts.push(token);
    }
  }

  return parts.join(",");
}

export function resolveUploadMediaKind(
  formats: string[],
  accept?: string | null,
): UploadMediaKind {
  const acceptLower = (accept || "").toLowerCase();
  const upper = formats.map((format) => format.toUpperCase());

  if (
    acceptLower.includes("audio/*") ||
    (upper.length > 0 && upper.every((format) => AUDIO_FORMATS.has(format)))
  ) {
    return "audio";
  }
  if (
    acceptLower.includes("video/*") ||
    (upper.length > 0 && upper.every((format) => VIDEO_FORMATS.has(format)))
  ) {
    return "video";
  }
  if (
    acceptLower.includes("image/*") ||
    (upper.length > 0 && upper.every((format) => IMAGE_FORMATS.has(format)))
  ) {
    return "image";
  }
  if (upper.length > 0 && upper.every((format) => format === "PDF")) {
    return "pdf";
  }
  if (!upper.length && acceptLower.includes("application/pdf")) {
    return "pdf";
  }
  if (!upper.length) {
    if (acceptLower.includes("audio/")) return "audio";
    if (acceptLower.includes("video/")) return "video";
    if (acceptLower.includes("image/")) return "image";
  }
  return "file";
}

export function extractAcceptFromInput(input: ReactNode): string | undefined {
  let found: string | undefined;

  Children.forEach(input, (child) => {
    if (found || !isValidElement(child)) return;
    const accept = (child.props as { accept?: unknown }).accept;
    if (typeof accept === "string" && accept.trim()) {
      found = accept;
    }
  });

  return found;
}

export function ensureInputAccept(input: ReactNode, accept?: string): ReactNode {
  if (!accept?.trim()) return input;

  return Children.map(input, (child) => {
    if (!isValidElement(child)) return child;
    const props = child.props as { accept?: unknown; type?: unknown };
    if (props.type !== "file") return child;
    if (typeof props.accept === "string" && props.accept.trim()) return child;
    return cloneElement(child as ReactElement<{ accept?: string }>, { accept });
  });
}

export function resolveUploadFormats(options: {
  supportedFormats?: string[];
  accept?: string | null;
}): string[] {
  const explicit = (options.supportedFormats ?? [])
    .map((f) => f.trim())
    .filter(Boolean);
  if (explicit.length) return explicit;
  return formatsFromAcceptAttr(options.accept);
}
