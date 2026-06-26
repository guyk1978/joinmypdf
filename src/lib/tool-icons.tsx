import { clsx } from "clsx";
import type { ReactNode } from "react";

export type ToolIconVisual = {
  icon: ReactNode;
  wrap: string;
  wrapHover: string;
};

/** Shared class: dark-mode icon container styling is defined in globals.css */
export const TOOL_ICON_WRAP_CLASS = "tool-icon-wrap";

/** Large bare icons on tool grid cards — no matte border box */
export const TOOL_ICON_BARE_CLASS = "tool-icon-bare";

const ICON_CLASS = "h-6 w-6";

function MergeIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="5" width="7" height="10" rx="1.5" fill="#4F46E5" />
      <rect x="14" y="9" width="7" height="10" rx="1.5" fill="#6366F1" opacity="0.85" />
      <circle cx="12" cy="12" r="3.2" fill="#312E81" />
      <path d="M11 10.5V13.5M9.5 12H12.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CompressIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="6" y="3" width="12" height="18" rx="2" fill="#EA580C" />
      <path d="M12 7V10M9.5 8.5L12 7L14.5 8.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17V14M9.5 15.5L12 17L14.5 15.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12H16" stroke="#FDBA74" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  );
}

function SplitIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="4" y="4" width="7" height="16" rx="1.5" fill="#A855F7" />
      <rect x="13" y="4" width="7" height="16" rx="1.5" fill="#C084FC" />
      <path d="M12 6V18" stroke="#6B21A8" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 2" />
      <circle cx="12" cy="12" r="2.2" fill="#7E22CE" />
      <path d="M10.5 11L12 12.5L13.5 11M10.5 13L12 11.5L13.5 13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function PaperMarginIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="1.5" fill="#e5e5e5" stroke="#404040" strokeWidth="1" />
      <rect x="7" y="6" width="10" height="12" rx="1" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="1.2" strokeDasharray="3 2" />
      <path d="M8 9h8M8 12h6M8 15h4" stroke="#a3a3a3" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function AuditorIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <path d="M12 3 4 7v5c0 5.25 3.5 9.74 8 11 4.5-1.26 8-5.75 8-11V7l-8-4Z" fill="#10B981" />
      <path d="M9 12l2 2 4-4" stroke="#ECFDF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#F59E0B" opacity="0.9" />
      <path d="M15.5 17.5h4M17.5 15.5v4" stroke="#FFFBEB" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function BookletIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="2" y="5" width="9" height="14" rx="1.5" fill="#F59E0B" />
      <rect x="13" y="5" width="9" height="14" rx="1.5" fill="#FBBF24" />
      <path d="M11.5 5v14" stroke="#B45309" strokeWidth="1.5" strokeDasharray="2 2" />
      <path d="M5 9h3M5 12h4M5 15h2" stroke="#FFFBEB" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16 10h2M16 13h3M16 16h2" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ComparePdfIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="4" width="8" height="16" rx="1.5" fill="#0EA5E9" />
      <rect x="13" y="4" width="8" height="16" rx="1.5" fill="#38BDF8" />
      <path d="M7 9h2M7 12h3M7 15h2" stroke="#E0F2FE" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M15 10h2M15 13h3M15 16h2" stroke="#0369A1" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 8l2 2-2 2M11 14l2-2 2 2" stroke="#F0F9FF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ImageToPdfIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="2" y="5" width="9" height="9" rx="2" fill="#14B8A6" />
      <circle cx="5.5" cy="8" r="1.2" fill="#CCFBF1" />
      <path d="M3.5 12.5L6 10L8 12L10.5 9" stroke="#CCFBF1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="13" y="10" width="9" height="11" rx="1.5" fill="#EF4444" />
      <path d="M15.5 17H19.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 9.5H14M14 9.5L12.5 8M14 9.5L12.5 11" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PdfToImageIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="2" y="10" width="9" height="11" rx="1.5" fill="#EF4444" />
      <path d="M4.5 17H8.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="13" y="5" width="9" height="9" rx="2" fill="#06B6D4" />
      <circle cx="16.5" cy="8" r="1.2" fill="#CFFAFE" />
      <path d="M14.5 12.5L16.5 10.5L19 12.5" stroke="#CFFAFE" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 12.5H14M14 12.5L12.5 11M14 12.5L12.5 14" stroke="#0891B2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WordIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" fill="#2563EB" />
      <path d="M8 8.5L10.5 15.5L12 11L13.5 15.5L16 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="6" width="3" height="12" rx="0.5" fill="#1D4ED8" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" fill="#0284C7" />
      <path d="M8 8H16M8 11H16M8 14H13" stroke="#E0F2FE" strokeWidth="1.4" strokeLinecap="round" />
      <text x="7.4" y="18.2" fill="white" fontSize="5.5" fontWeight="bold" fontFamily="monospace">
        TXT
      </text>
    </svg>
  );
}

function ExcelIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" fill="#16A34A" />
      <path d="M8 7H16M8 10.5H16M8 14H16M8 17.5H13" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 7V17.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      <text x="7.5" y="11" fill="white" fontSize="5" fontWeight="bold" fontFamily="system-ui,sans-serif">
        X
      </text>
    </svg>
  );
}

function PowerPointIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" fill="#C2410C" />
      <rect x="7" y="7" width="10" height="7" rx="1" fill="#FB923C" />
      <circle cx="12" cy="10.5" r="2" fill="white" opacity="0.9" />
      <text x="10.5" y="17.5" fill="white" fontSize="6" fontWeight="bold" fontFamily="system-ui,sans-serif">
        P
      </text>
    </svg>
  );
}

function LockClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2.5" fill="#DC2626" />
      <path d="M8.5 11V8.25C8.5 5.9 10.4 4 12.75 4C15.1 4 17 5.9 17 8.25V11" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="1.8" fill="#FEF3C7" />
      <rect x="11" y="14.5" width="2" height="3" rx="0.5" fill="#B91C1C" />
    </svg>
  );
}

function LockOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2.5" fill="#16A34A" />
      <path d="M8.5 11V8.25C8.5 6.5 9.8 5 11.5 5" stroke="#86EFAC" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 8.25V11" stroke="#86EFAC" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="1.8" fill="#DCFCE7" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <path
        d="M12 5a7 7 0 1 1-4.95 11.95"
        stroke="#DB2777"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M7 5H12V10" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="9" width="6" height="8" rx="1" fill="#F472B6" opacity="0.35" />
    </svg>
  );
}

function DeletePagesIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <path d="M6 7H18L17 20H7L6 7Z" fill="#F87171" />
      <path d="M9 7V5.5C9 4.67 9.67 4 10.5 4H13.5C14.33 4 15 4.67 15 5.5V7" stroke="#DC2626" strokeWidth="1.5" />
      <path d="M10 10V17M14 10V17" stroke="#B91C1C" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="4" y="7" width="16" height="2" rx="0.5" fill="#EF4444" />
    </svg>
  );
}

function RedactIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="5" y="4" width="14" height="16" rx="2" fill="#475569" />
      <rect x="7" y="9" width="10" height="2.5" rx="0.5" fill="#0a0a0a" />
      <rect x="7" y="13" width="7" height="2.5" rx="0.5" fill="#0a0a0a" />
      <path d="M7 17H14" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="14" y="12" width="5" height="5" rx="1" fill="#171717" stroke="#F59E0B" strokeWidth="1.2" />
    </svg>
  );
}

function SignIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" fill="#6366F1" />
      <path d="M7 14C8.5 11 10 11 12 13C14 15 15.5 14 17 12" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 8L17 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CropIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <path d="M6 4V14C6 15.1 6.9 16 8 16H18" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 6V16C18 17.1 17.1 18 16 18H6" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" />
      <rect x="9" y="9" width="8" height="8" rx="1" fill="#F87171" opacity="0.45" />
    </svg>
  );
}

function WatermarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="5" y="4" width="14" height="16" rx="2" fill="#404040" />
      <text x="7" y="15" fill="white" opacity="0.35" fontSize="7" fontWeight="bold" fontFamily="system-ui,sans-serif" transform="rotate(-18 12 12)">
        WM
      </text>
      <circle cx="16" cy="8" r="2.5" fill="#38BDF8" />
    </svg>
  );
}

function PageNumbersIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="5" y="4" width="14" height="16" rx="2" fill="#4F46E5" />
      <text x="9" y="14" fill="white" fontSize="7" fontWeight="bold" fontFamily="system-ui,sans-serif">
        123
      </text>
      <rect x="8" y="16" width="8" height="1.5" rx="0.5" fill="#A5B4FC" />
    </svg>
  );
}

function PngIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="2" y="5" width="9" height="9" rx="2" fill="#8B5CF6" />
      <text
        x="6.5"
        y="10.8"
        textAnchor="middle"
        fill="white"
        fontSize="4"
        fontWeight="bold"
        fontFamily="ui-monospace, monospace"
      >
        PNG
      </text>
      <rect x="13" y="10" width="9" height="11" rx="1.5" fill="#EF4444" />
      <path d="M15.5 17H19.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 9.5H14" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HeicIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="2" y="5" width="9" height="9" rx="2" fill="#F59E0B" />
      <text
        x="6.5"
        y="10.8"
        textAnchor="middle"
        fill="white"
        fontSize="3.6"
        fontWeight="bold"
        fontFamily="ui-monospace, monospace"
      >
        HEIC
      </text>
      <rect x="13" y="10" width="9" height="11" rx="1.5" fill="#EF4444" />
      <path d="M15.5 17H19.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function HtmlIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2" fill="#E11D48" />
      <path d="M8 9L6 12L8 15M16 9L18 12L16 15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 8L11 16" stroke="#FDA4AF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MarkdownIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2" fill="#262626" />
      <text x="6" y="15" fill="white" fontSize="8" fontWeight="bold" fontFamily="monospace">
        M↓
      </text>
    </svg>
  );
}

function EbookIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <path d="M6 5C6 5 8 4 12 4C16 4 18 5 18 5V19C18 19 16 18 12 18C8 18 6 19 6 19V5Z" fill="#7C3AED" />
      <path d="M6 5C6 5 8 6 12 6C16 6 18 5 18 5" stroke="#C4B5FD" strokeWidth="1.5" />
      <path d="M12 8V14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CadIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#0E7490" />
      <path d="M6 18L12 6L18 18" stroke="#67E8F9" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <circle cx="12" cy="13" r="2.5" stroke="white" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function OpenOfficeIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" fill="#0D9488" />
      <rect x="7" y="7" width="4" height="4" rx="0.5" fill="white" opacity="0.9" />
      <rect x="13" y="7" width="4" height="4" rx="0.5" fill="#99F6E4" />
      <rect x="7" y="13" width="10" height="4" rx="0.5" fill="#5EEAD4" />
    </svg>
  );
}

function IworkIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="5" y="4" width="14" height="16" rx="2" fill="#404040" />
      <circle cx="12" cy="12" r="4" fill="#38BDF8" />
      <path d="M12 9V15M9 12H15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function InvoiceIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" fill="#059669" />
      <path d="M8 8H16M8 11.5H14M8 15H12" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <text x="13" y="17" fill="#6EE7B7" fontSize="6" fontWeight="bold" fontFamily="system-ui,sans-serif">
        $
      </text>
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" fill="#7C3AED" />
      <rect x="5" y="9" width="5" height="2.5" rx="0.5" fill="#C4B5FD" />
      <rect x="11" y="12" width="7" height="2.5" rx="0.5" fill="#A78BFA" />
      <circle cx="7.5" cy="8" r="1.2" fill="#FDE68A" />
      <circle cx="15" cy="11" r="1.2" fill="#FDE68A" />
    </svg>
  );
}

function DataIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" fill="#2563EB" />
      <path d="M6 9H18M6 12.5H14M6 16H11" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17" cy="16" r="2.5" fill="#F59E0B" />
    </svg>
  );
}

function AnnotateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path strokeLinecap="round" d="m13 7 4 4" />
      <path strokeLinecap="round" d="M3 21l2-2" opacity="0.5" />
    </svg>
  );
}

function DefaultPdfIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="none" aria-hidden>
      <path d="M7 3.5H14.5L19.5 8.5V19.25C19.5 20.22 18.72 21 17.75 21H7C6.03 21 5.25 20.22 5.25 19.25V5.25C5.25 4.28 6.03 3.5 7 3.5Z" fill="#EF4444" />
      <path d="M14.5 3.5V7.8C14.5 8.2 14.8 8.5 15.2 8.5H19.5" fill="#F97316" />
      <path d="M8 16H16" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Longest-match-first patterns → canonical tool key */
const SLUG_RESOLVERS: { test: (s: string) => boolean; key: string }[] = [
  { test: (s) => s.includes("delete-pdf-pages"), key: "delete-pdf-pages" },
  { test: (s) => s.includes("add-page-numbers"), key: "add-page-numbers" },
  { test: (s) => s.includes("add-watermark"), key: "add-watermark" },
  { test: (s) => s.includes("pdf-to-powerpoint"), key: "pdf-to-powerpoint" },
  { test: (s) => s.includes("powerpoint-to-pdf"), key: "powerpoint-to-pdf" },
  { test: (s) => s.includes("pdf-to-excel"), key: "pdf-to-excel" },
  { test: (s) => s.includes("excel-to-pdf"), key: "excel-to-pdf" },
  { test: (s) => s.includes("pdf-to-word"), key: "pdf-to-word" },
  { test: (s) => s.includes("pdf-to-text"), key: "pdf-to-text" },
  { test: (s) => s.includes("extract-images"), key: "extract-images" },
  { test: (s) => s.includes("word-to-pdf"), key: "word-to-pdf" },
  { test: (s) => s.includes("invoice-generator"), key: "invoice-generator" },
  { test: (s) => s.includes("timeline-gantt"), key: "timeline-gantt-generator" },
  { test: (s) => s.includes("data-converter"), key: "data-converter-visualizer" },
  { test: (s) => s.includes("protect-pdf"), key: "protect-pdf" },
  { test: (s) => s.includes("pdf-password-recovery"), key: "pdf-password-recovery" },
  { test: (s) => s.includes("unlock-pdf"), key: "unlock-pdf" },
  { test: (s) => s.includes("remove-hidden-metadata"), key: "remove-hidden-metadata" },
  { test: (s) => s.includes("flatten-pdf"), key: "flatten-pdf" },
  { test: (s) => s.includes("repair-pdf"), key: "repair-pdf" },
  { test: (s) => s.includes("redact-pdf"), key: "redact-pdf" },
  { test: (s) => s.includes("rotate-pdf"), key: "rotate-pdf" },
  { test: (s) => s.includes("crop-pdf"), key: "crop-pdf" },
  { test: (s) => s.includes("sign-pdf"), key: "sign-pdf" },
  { test: (s) => s.includes("autocad-to-pdf"), key: "autocad-to-pdf" },
  { test: (s) => s.includes("openoffice-to-pdf"), key: "openoffice-to-pdf" },
  { test: (s) => s.includes("markdown-to-pdf"), key: "markdown-to-pdf" },
  { test: (s) => s.includes("html-to-pdf"), key: "html-to-pdf" },
  { test: (s) => s.includes("ebook-to-pdf"), key: "ebook-to-pdf" },
  { test: (s) => s.includes("iwork-to-pdf"), key: "iwork-to-pdf" },
  { test: (s) => s.includes("heic-to-pdf"), key: "heic-to-pdf" },
  { test: (s) => s.includes("png-to-pdf"), key: "png-to-pdf" },
  { test: (s) => s.includes("jpg-to-pdf"), key: "jpg-to-pdf" },
  { test: (s) => s.includes("pdf-to-png"), key: "pdf-to-png" },
  { test: (s) => s.includes("pdf-to-jpg"), key: "pdf-to-jpg" },
  { test: (s) => s.includes("pdf-compress"), key: "pdf-compress" },
  { test: (s) => s.includes("custom-paper-margin"), key: "custom-paper-margin" },
  { test: (s) => s.includes("safe-to-share-auditor"), key: "safe-to-share-auditor" },
  { test: (s) => s.includes("pdf-to-booklet"), key: "pdf-to-booklet" },
  { test: (s) => s.includes("compare-pdf"), key: "compare-pdf" },
  { test: (s) => s.includes("batch-rename-pdf"), key: "batch-rename-pdf" },
  { test: (s) => s.includes("pdf-text-editor"), key: "pdf-text-editor" },
  { test: (s) => s.includes("annotate-pdf"), key: "annotate-pdf" },
  { test: (s) => s.includes("reorder-pdf-pages"), key: "reorder-pdf-pages" },
  { test: (s) => s.includes("extract-pdf-pages"), key: "extract-pdf-pages" },
  { test: (s) => s.includes("pdf-split"), key: "pdf-split" },
  { test: (s) => s.includes("pdf-merge"), key: "pdf-merge" },
];

function resolveToolKey(slug?: string, label?: string): string {
  const source = `${slug || ""} ${label || ""}`.toLowerCase();
  for (const { test, key } of SLUG_RESOLVERS) {
    if (test(source)) return key;
  }
  return "default";
}

const TOOL_ICON_MAP: Record<string, ToolIconVisual> = {
  "pdf-merge": {
    icon: <MergeIcon />,
    wrap: "bg-neutral-900 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-900 group-hover:ring-neutral-400 dark:group-hover:ring-neutral-600",
  },
  "pdf-compress": {
    icon: <CompressIcon />,
    wrap: "bg-orange-100 ring-1 ring-orange-200",
    wrapHover: "group-hover:bg-orange-200 group-hover:ring-orange-300",
  },
  "pdf-split": {
    icon: <SplitIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "pdf-to-booklet": {
    icon: <BookletIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "compare-pdf": {
    icon: <ComparePdfIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "batch-rename-pdf": {
    icon: <PageNumbersIcon />,
    wrap: "bg-teal-100 ring-1 ring-teal-200",
    wrapHover: "group-hover:bg-teal-200 group-hover:ring-teal-300",
  },
  "pdf-text-editor": {
    icon: <TextIcon />,
    wrap: "bg-violet-100 ring-1 ring-violet-200",
    wrapHover: "group-hover:bg-violet-200 group-hover:ring-violet-300",
  },
  "annotate-pdf": {
    icon: <AnnotateIcon />,
    wrap: "bg-amber-100 ring-1 ring-amber-200",
    wrapHover: "group-hover:bg-amber-200 group-hover:ring-amber-300",
  },
  "reorder-pdf-pages": {
    icon: <SplitIcon />,
    wrap: "bg-violet-100 ring-1 ring-violet-200",
    wrapHover: "group-hover:bg-violet-200 group-hover:ring-violet-300",
  },
  "extract-pdf-pages": {
    icon: <SplitIcon />,
    wrap: "bg-teal-100 ring-1 ring-teal-200",
    wrapHover: "group-hover:bg-teal-200 group-hover:ring-teal-300",
  },
  "jpg-to-pdf": {
    icon: <ImageToPdfIcon />,
    wrap: "bg-teal-100 ring-1 ring-teal-200",
    wrapHover: "group-hover:bg-teal-200 group-hover:ring-teal-300",
  },
  "png-to-pdf": {
    icon: <PngIcon />,
    wrap: "bg-violet-100 ring-1 ring-violet-200",
    wrapHover: "group-hover:bg-violet-200 group-hover:ring-violet-300",
  },
  "heic-to-pdf": {
    icon: <HeicIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "pdf-to-jpg": {
    icon: <PdfToImageIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "pdf-to-png": {
    icon: <PdfToImageIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "pdf-to-word": {
    icon: <WordIcon />,
    wrap: "bg-neutral-900 ring-1 ring-neutral-400 dark:ring-neutral-600",
    wrapHover: "group-hover:bg-neutral-900 group-hover:ring-neutral-400 dark:ring-neutral-600",
  },
  "pdf-to-text": {
    icon: <TextIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "extract-images": {
    icon: <PdfToImageIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "word-to-pdf": {
    icon: <WordIcon />,
    wrap: "bg-neutral-900 ring-1 ring-neutral-400 dark:ring-neutral-600",
    wrapHover: "group-hover:bg-neutral-900 group-hover:ring-neutral-400 dark:ring-neutral-600",
  },
  "pdf-to-excel": {
    icon: <ExcelIcon />,
    wrap: "bg-green-100 ring-1 ring-green-200",
    wrapHover: "group-hover:bg-green-200 group-hover:ring-green-300",
  },
  "excel-to-pdf": {
    icon: <ExcelIcon />,
    wrap: "bg-neutral-900 dark:bg-neutral-200 ring-1 ring-neutral-400 dark:ring-neutral-600",
    wrapHover: "group-hover:bg-neutral-900 dark:bg-neutral-200 group-hover:ring-neutral-400 dark:ring-neutral-600",
  },
  "pdf-to-powerpoint": {
    icon: <PowerPointIcon />,
    wrap: "bg-orange-100 ring-1 ring-orange-300",
    wrapHover: "group-hover:bg-orange-200 group-hover:ring-orange-400",
  },
  "powerpoint-to-pdf": {
    icon: <PowerPointIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "protect-pdf": {
    icon: <LockClosedIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "unlock-pdf": {
    icon: <LockOpenIcon />,
    wrap: "bg-green-100 ring-1 ring-green-200",
    wrapHover: "group-hover:bg-green-200 group-hover:ring-green-300",
  },
  "pdf-password-recovery": {
    icon: <LockOpenIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "rotate-pdf": {
    icon: <RotateIcon />,
    wrap: "bg-pink-100 ring-1 ring-pink-200",
    wrapHover: "group-hover:bg-pink-200 group-hover:ring-pink-300",
  },
  "delete-pdf-pages": {
    icon: <DeletePagesIcon />,
    wrap: "bg-rose-100 ring-1 ring-rose-200",
    wrapHover: "group-hover:bg-rose-200 group-hover:ring-rose-300",
  },
  "remove-hidden-metadata": {
    icon: <LockClosedIcon />,
    wrap: "bg-neutral-900 dark:bg-neutral-200 ring-1 ring-neutral-400 dark:ring-neutral-600",
    wrapHover: "group-hover:bg-neutral-900 dark:bg-neutral-200 group-hover:ring-neutral-400 dark:ring-neutral-600",
  },
  "flatten-pdf": {
    icon: <RedactIcon />,
    wrap: "bg-violet-100 ring-1 ring-violet-200",
    wrapHover: "group-hover:bg-violet-200 group-hover:ring-violet-300",
  },
  "repair-pdf": {
    icon: <CompressIcon />,
    wrap: "bg-amber-100 ring-1 ring-amber-200",
    wrapHover: "group-hover:bg-amber-200 group-hover:ring-amber-300",
  },
  "safe-to-share-auditor": {
    icon: <AuditorIcon />,
    wrap: "bg-neutral-900 dark:bg-neutral-200 ring-1 ring-neutral-400 dark:ring-neutral-600",
    wrapHover: "group-hover:bg-neutral-900 dark:bg-neutral-200 group-hover:ring-neutral-400 dark:ring-neutral-600",
  },
  "redact-pdf": {
    icon: <RedactIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-900 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-900 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "sign-pdf": {
    icon: <SignIcon />,
    wrap: "bg-neutral-900 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-900 group-hover:ring-neutral-400 dark:group-hover:ring-neutral-600",
  },
  "custom-paper-margin": {
    icon: <PaperMarginIcon />,
    wrap: "bg-neutral-100 dark:bg-neutral-900 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-900 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "crop-pdf": {
    icon: <CropIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "add-watermark": {
    icon: <WatermarkIcon />,
    wrap: "bg-neutral-100 dark:bg-neutral-900 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-900 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "add-page-numbers": {
    icon: <PageNumbersIcon />,
    wrap: "bg-neutral-900 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-900 group-hover:ring-neutral-400 dark:group-hover:ring-neutral-600",
  },
  "html-to-pdf": {
    icon: <HtmlIcon />,
    wrap: "bg-rose-100 ring-1 ring-rose-200",
    wrapHover: "group-hover:bg-rose-200 group-hover:ring-rose-300",
  },
  "markdown-to-pdf": {
    icon: <MarkdownIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-900 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-900 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "ebook-to-pdf": {
    icon: <EbookIcon />,
    wrap: "bg-violet-100 ring-1 ring-violet-200",
    wrapHover: "group-hover:bg-violet-200 group-hover:ring-violet-300",
  },
  "autocad-to-pdf": {
    icon: <CadIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "openoffice-to-pdf": {
    icon: <OpenOfficeIcon />,
    wrap: "bg-teal-100 ring-1 ring-teal-200",
    wrapHover: "group-hover:bg-teal-200 group-hover:ring-teal-300",
  },
  "iwork-to-pdf": {
    icon: <IworkIcon />,
    wrap: "bg-neutral-100 dark:bg-neutral-900 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-900 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "invoice-generator": {
    icon: <InvoiceIcon />,
    wrap: "bg-neutral-900 dark:bg-neutral-200 ring-1 ring-neutral-400 dark:ring-neutral-600",
    wrapHover: "group-hover:bg-neutral-900 dark:bg-neutral-200 group-hover:ring-neutral-400 dark:ring-neutral-600",
  },
  "timeline-gantt-generator": {
    icon: <TimelineIcon />,
    wrap: "bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700",
    wrapHover: "group-hover:bg-neutral-200 dark:bg-neutral-800 group-hover:ring-neutral-300 dark:ring-neutral-700",
  },
  "data-converter-visualizer": {
    icon: <DataIcon />,
    wrap: "bg-neutral-900 ring-1 ring-neutral-400 dark:ring-neutral-600",
    wrapHover: "group-hover:bg-neutral-900 group-hover:ring-neutral-400 dark:ring-neutral-600",
  },
  default: {
    icon: <DefaultPdfIcon />,
    wrap: "bg-rose-100 ring-1 ring-rose-200",
    wrapHover: "group-hover:bg-rose-200 group-hover:ring-rose-300",
  },
};

export function getToolIcon(slug?: string, label?: string): ToolIconVisual {
  const key = resolveToolKey(slug, label);
  return TOOL_ICON_MAP[key] ?? TOOL_ICON_MAP.default;
}

/** Extra-vivid icon containers for the tools directory grid. */
const DIRECTORY_ICON_WRAP: Record<string, string> = {
  "pdf-merge": "bg-neutral-900 ring-2 ring-neutral-400 dark:ring-neutral-600",
  "pdf-compress": "bg-orange-100 ring-2 ring-orange-300",
  "pdf-split": "bg-violet-100 ring-2 ring-violet-300",
  "crop-pdf": "bg-neutral-200 dark:bg-neutral-800 ring-2 ring-neutral-300 dark:ring-neutral-700",
  "sign-pdf": "bg-neutral-900 ring-2 ring-neutral-400 dark:ring-neutral-600",
  "protect-pdf": "bg-neutral-200 dark:bg-neutral-800 ring-2 ring-neutral-300 dark:ring-neutral-700",
  "unlock-pdf": "bg-neutral-900 dark:bg-neutral-200 ring-2 ring-neutral-400 dark:ring-neutral-600",
  "redact-pdf": "bg-neutral-200 dark:bg-neutral-900 ring-2 ring-neutral-300 dark:ring-neutral-700",
  "jpg-to-pdf": "bg-teal-100 ring-2 ring-teal-300",
  "pdf-to-jpg": "bg-neutral-200 dark:bg-neutral-800 ring-2 ring-neutral-300 dark:ring-neutral-700",
  "pdf-to-png": "bg-neutral-200 dark:bg-neutral-800 ring-2 ring-neutral-300 dark:ring-neutral-700",
  "invoice-generator": "bg-neutral-900 dark:bg-neutral-200 ring-2 ring-neutral-400 dark:ring-neutral-600",
};

/** Large colorful icon for tools directory — app-launcher style. */
export function ToolDirectoryIcon({
  slug,
  label,
  className,
}: {
  slug?: string;
  label?: string;
  className?: string;
}) {
  const key = resolveToolKey(slug, label);
  const visual = getToolIcon(slug, label);
  const wrap = DIRECTORY_ICON_WRAP[key] ?? visual.wrap.replace("ring-1", "ring-2");
  return (
    <span
      className={clsx(
        TOOL_ICON_WRAP_CLASS,
        "mb-3 inline-flex items-center justify-center rounded-none p-3 transition-transform duration-300 group-hover:scale-105",
        wrap,
        "[&_svg]:h-10 [&_svg]:w-10 md:[&_svg]:h-12 md:[&_svg]:w-12",
        className,
      )}
      aria-hidden
    >
      {visual.icon}
    </span>
  );
}

/** Compact colorful badge for nav mega menu rows. */
export function ToolIconBadge({
  slug,
  label,
  size = "md",
  className,
}: {
  slug?: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const visual = getToolIcon(slug, label);
  return (
    <span
      className={clsx(
        TOOL_ICON_WRAP_CLASS,
        "inline-flex shrink-0 items-center justify-center rounded-none ring-1 ring-black/5",
        size === "sm" ? "h-6 w-6 [&_svg]:h-4 [&_svg]:w-4" : "h-8 w-8 [&_svg]:h-[18px] [&_svg]:w-[18px]",
        visual.wrap,
        className,
      )}
      aria-hidden
    >
      {visual.icon}
    </span>
  );
}
