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

/** Red & white — matches tool grid icons */
const R = "#E53935";
const RD = "#C62828";
const W = "#FFFFFF";

/** Canonical from → to for every conversion tool slug. */
const CONVERT_TOOL_PAIRS: Record<string, { from: string; to: string }> = {
  "pdf-to-png": { from: "pdf", to: "png" },
  "pdf-to-jpg": { from: "pdf", to: "jpg" },
  "pdf-to-word": { from: "pdf", to: "word" },
  "pdf-to-excel": { from: "pdf", to: "excel" },
  "pdf-to-powerpoint": { from: "pdf", to: "powerpoint" },
  "pdf-to-text": { from: "pdf", to: "text" },
  "pdf-to-html": { from: "pdf", to: "html" },
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
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill={R} />
      <path d="M8 16H16" stroke={W} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HeicFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill={W} stroke={R} strokeWidth="1.2" />
      <text
        x="12"
        y="13.5"
        textAnchor="middle"
        fill={R}
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
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill={W} stroke={R} strokeWidth="1.2" />
      <circle cx="8.5" cy="9" r="1.5" fill={R} />
      <path
        d="M6.5 16L9.5 12.5L12 15L15.5 11L18.5 16"
        stroke={R}
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
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill={R} />
      <circle cx="8.5" cy="9" r="1.5" fill={W} />
      <path
        d="M6.5 16L9.5 12.5L12 15L15.5 11L18.5 16"
        stroke={W}
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
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill={W} stroke={R} strokeWidth="1.2" />
      <path
        d="M8 8.5L10.5 15.5L12 11.5L13.5 15.5L16 8.5"
        stroke={R}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="3" y="6" width="3" height="12" rx="0.5" fill={R} />
    </svg>
  );
}

function ExcelFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill={W} stroke={R} strokeWidth="1.2" />
      <text x="12" y="14.5" textAnchor="middle" fill={R} fontSize="7" fontWeight="bold" fontFamily="system-ui,sans-serif">
        X
      </text>
    </svg>
  );
}

function PowerPointFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill={R} />
      <rect x="7" y="7.5" width="10" height="6.5" rx="1" fill={RD} />
      <circle cx="12" cy="10.5" r="1.8" fill={W} opacity="0.95" />
    </svg>
  );
}

function TextFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill={R} />
      <path d="M8 8.5H16M8 11.5H16M8 14.5H13" stroke={W} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HtmlFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill={R} />
      <path
        d="M8.5 9L6.5 12L8.5 15M15.5 9L17.5 12L15.5 15"
        stroke={W}
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
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill={R} />
      <text x="12" y="14.5" textAnchor="middle" fill={W} fontSize="7" fontWeight="bold" fontFamily="monospace">
        M↓
      </text>
    </svg>
  );
}

function BookletFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={HERO_ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="4" width="8" height="16" rx="1.5" fill={W} stroke={R} strokeWidth="1" />
      <rect x="13" y="4" width="8" height="16" rx="1.5" fill={R} />
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

export function ConvertFlowArrow({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 24"
      className={
        compact
          ? "h-7 w-10 shrink-0 sm:h-8 sm:w-12"
          : "h-12 w-16 shrink-0 sm:h-14 sm:w-20 md:h-16 md:w-24"
      }
      fill="none"
      aria-hidden
    >
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
