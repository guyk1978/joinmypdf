import type { ReactNode } from "react";
import { getToolIcon } from "@/lib/tool-icons";

export type ToolUploadHeroVisual =
  | { kind: "single"; icon: ReactNode }
  | { kind: "convert"; from: ReactNode; to: ReactNode };

export type ToolUploadWatermark = {
  placement: "center" | "bottom-left" | "top-right";
  icon: ReactNode;
};

const HERO_ICON_CLASS = "h-full w-full";

/** Canonical from → to for every conversion tool slug. */
const CONVERT_TOOL_PAIRS: Record<string, { from: string; to: string }> = {
  "pdf-to-png": { from: "pdf", to: "png" },
  "pdf-to-jpg": { from: "pdf", to: "jpg" },
  "pdf-to-word": { from: "pdf", to: "word" },
  "pdf-to-excel": { from: "pdf", to: "excel" },
  "pdf-to-powerpoint": { from: "pdf", to: "powerpoint" },
  "pdf-to-text": { from: "pdf", to: "text" },
  "pdf-to-booklet": { from: "pdf", to: "booklet" },
  "jpg-to-pdf": { from: "jpg", to: "pdf" },
  "png-to-pdf": { from: "png", to: "pdf" },
  "heic-to-pdf": { from: "heic", to: "pdf" },
  "word-to-pdf": { from: "word", to: "pdf" },
  "excel-to-pdf": { from: "excel", to: "pdf" },
  "powerpoint-to-pdf": { from: "powerpoint", to: "pdf" },
  "html-to-pdf": { from: "html", to: "pdf" },
  "markdown-to-pdf": { from: "markdown", to: "pdf" },
  "ebook-to-pdf": { from: "ebook", to: "pdf" },
  "openoffice-to-pdf": { from: "openoffice", to: "pdf" },
  "iwork-to-pdf": { from: "iwork", to: "pdf" },
  "autocad-to-pdf": { from: "autocad", to: "pdf" },
};

function PdfFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#EF4444" />
      <path d="M8 16H16" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HeicFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#F59E0B" />
      <text
        x="12"
        y="13.5"
        textAnchor="middle"
        fill="white"
        fontSize="5"
        fontWeight="bold"
        fontFamily="ui-monospace, monospace"
      >
        HEIC
      </text>
    </svg>
  );
}

function PngFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#06B6D4" />
      <circle cx="8.5" cy="9" r="1.5" fill="#CFFAFE" />
      <path
        d="M6.5 16L9.5 12.5L12 15L15.5 11L18.5 16"
        stroke="#CFFAFE"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function JpgFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#14B8A6" />
      <circle cx="8.5" cy="9" r="1.5" fill="#CCFBF1" />
      <path
        d="M6.5 16L9.5 12.5L12 15L15.5 11L18.5 16"
        stroke="#CCFBF1"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WordFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#2563EB" />
      <path
        d="M8 8.5L10.5 15.5L12 11.5L13.5 15.5L16 8.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExcelFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#16A34A" />
      <text x="12" y="14.5" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="system-ui,sans-serif">
        X
      </text>
    </svg>
  );
}

function PowerPointFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#C2410C" />
      <rect x="7" y="7.5" width="10" height="6.5" rx="1" fill="#FB923C" />
      <circle cx="12" cy="10.5" r="1.8" fill="white" opacity="0.95" />
    </svg>
  );
}

function TextFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#0284C7" />
      <path d="M8 8.5H16M8 11.5H16M8 14.5H13" stroke="#E0F2FE" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HtmlFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#E11D48" />
      <path
        d="M8.5 9L6.5 12L8.5 15M15.5 9L17.5 12L15.5 15"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MarkdownFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#404040" />
      <text x="12" y="14.5" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="monospace">
        M↓
      </text>
    </svg>
  );
}

function BookletFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="4" width="8" height="16" rx="1.5" fill="#F59E0B" />
      <rect x="13" y="4" width="8" height="16" rx="1.5" fill="#FBBF24" />
    </svg>
  );
}

const FORMAT_ICON_BUILDERS: Record<string, () => ReactNode> = {
  pdf: PdfFormatIcon,
  heic: HeicFormatIcon,
  png: PngFormatIcon,
  jpg: JpgFormatIcon,
  jpeg: JpgFormatIcon,
  word: WordFormatIcon,
  excel: ExcelFormatIcon,
  powerpoint: PowerPointFormatIcon,
  text: TextFormatIcon,
  html: HtmlFormatIcon,
  markdown: MarkdownFormatIcon,
  booklet: BookletFormatIcon,
  ebook: () => getToolIcon("ebook-to-pdf").icon,
  openoffice: () => getToolIcon("openoffice-to-pdf").icon,
  iwork: () => getToolIcon("iwork-to-pdf").icon,
  autocad: () => getToolIcon("autocad-to-pdf").icon,
};

function normalizeToolSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/\/+$/g, "")
    .split("/")
    .pop() ?? slug;
}

function formatIcon(format: string): ReactNode {
  const key = format.toLowerCase().replace(/[^a-z0-9]/g, "");
  const builder = FORMAT_ICON_BUILDERS[key];
  if (builder) return builder();
  return getToolIcon(format).icon;
}

function parseConvertPair(slug: string): { from: string; to: string } | null {
  const key = normalizeToolSlug(slug);
  if (CONVERT_TOOL_PAIRS[key]) return CONVERT_TOOL_PAIRS[key];

  const pdfTo = key.match(/^pdf-to-([a-z0-9-]+)$/);
  if (pdfTo) return { from: "pdf", to: pdfTo[1] };

  const toPdf = key.match(/^([a-z0-9-]+)-to-pdf$/);
  if (toPdf) return { from: toPdf[1], to: "pdf" };

  return null;
}

export function getToolUploadHeroVisual(slug?: string, headline?: string): ToolUploadHeroVisual {
  if (!slug) {
    return { kind: "single", icon: getToolIcon(slug, headline).icon };
  }

  const pair = parseConvertPair(slug);
  if (pair) {
    return {
      kind: "convert",
      from: formatIcon(pair.from),
      to: formatIcon(pair.to),
    };
  }

  return { kind: "single", icon: getToolIcon(slug, headline).icon };
}

export function getToolUploadWatermarks(slug?: string, headline?: string): ToolUploadWatermark[] {
  if (!slug) {
    return [{ placement: "center", icon: getToolIcon(slug, headline).icon }];
  }

  const pair = parseConvertPair(slug);
  if (pair) {
    return [
      { placement: "bottom-left", icon: formatIcon(pair.from) },
      { placement: "top-right", icon: formatIcon(pair.to) },
    ];
  }

  return [{ placement: "center", icon: getToolIcon(slug, headline).icon }];
}

export function ConvertFlowArrow() {
  return (
    <svg viewBox="0 0 48 24" className="h-12 w-16 shrink-0 sm:h-14 sm:w-20 md:h-16 md:w-24" fill="none" aria-hidden>
      <path
        d="M6 12H38M38 12L30 6M38 12L30 18"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
