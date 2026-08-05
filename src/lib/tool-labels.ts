/** Strip marketing suffixes so card labels stay short (no "Online", taglines, etc.). */
export function stripToolLabelMarketing(label: string): string {
  return label
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/\s+[-–—]\s+.+$/u, "")
    .replace(/\bFree\s+Online\b/gi, "")
    .replace(/\bOnline\b/gi, "")
    .replace(/^\s*Free\s+/i, "")
    // Hebrew marketing fluff
    .replace(/\s*אונליין\s*/g, " ")
    .replace(/\s*בחינם\s*/g, " ")
    .replace(/^\s*חינם\s+/u, "")
    // Russian marketing fluff
    .replace(/\s*онлайн\s*/gi, " ")
    .replace(/\s*бесплатно\s*/gi, " ")
    .replace(/^\s*Бесплатн\S*\s+/u, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Short English display labels for tools in nav / grids when no localized
 * title is available. Prefer caller-provided (translated) titles instead.
 */
export function getToolDisplayLabel(slug: string, fallbackTitle: string): string {
  const localized = stripToolLabelMarketing(fallbackTitle);
  // If the caller already resolved a real title, keep it (supports he/ru).
  if (localized && localized !== slug && !looksLikeRawSlug(localized)) {
    return localized;
  }

  const map: Record<string, string> = {
    "pdf-merge": "Merge PDF",
    "pdf-compress": "Compress PDF",
    "pdf-split": "Split PDF",
    "batch-rename-pdf": "Batch Rename PDF",
    "pdf-text-editor": "PDF Text Editor",
    "annotate-pdf": "Annotate PDF",
    "reorder-pdf-pages": "Reorder PDF Pages",
    "extract-pdf-pages": "Extract PDF Pages",
    "n-up-pdf": "N-Up PDF",
    "compare-pdf": "Compare PDF",
    "pdf-to-booklet": "PDF to Booklet",
    "safe-to-share-auditor": "Safe-to-Share Auditor",
    "custom-paper-margin": "Paper & Margins",
    "add-page-numbers": "Add Page Numbers",
    "sign-pdf": "Sign PDF",
    "protect-pdf": "Protect PDF",
    "unlock-pdf": "Unlock PDF",
    "pdf-password-recovery": "Password Recovery",
    "redact-pdf": "Redact PDF",
    "flatten-pdf": "Flatten PDF",
    "repair-pdf": "Repair PDF",
    "remove-hidden-metadata": "Remove Metadata",
    "delete-pdf-pages": "Delete PDF Pages",
    "jpg-to-pdf": "JPG to PDF",
    "pdf-to-jpg": "PDF to JPG",
    "pdf-to-png": "PDF to PNG",
    "png-to-pdf": "PNG to PDF",
    "heic-to-pdf": "HEIC to PDF",
    "pdf-to-word": "PDF to Word",
    "pdf-to-text": "PDF to Text",
    "extract-images": "Extract Images",
    "word-to-pdf": "Word to PDF",
    "pdf-to-excel": "PDF to Excel",
    "excel-to-pdf": "Excel to PDF",
    "pdf-to-powerpoint": "PDF to PowerPoint",
    "powerpoint-to-pdf": "PowerPoint to PDF",
    "crop-pdf": "Crop PDF",
    "pdf-reader": "PDF Reader",
    "add-watermark": "Add Watermark",
    "rotate-pdf": "Rotate PDF",
    "autocad-to-pdf": "AutoCAD to PDF",
    "openoffice-to-pdf": "OpenOffice to PDF",
    "markdown-to-pdf": "Markdown to PDF",
    "html-to-pdf": "HTML to PDF",
    "eml-to-pdf": "EML to PDF",
    "ebook-to-pdf": "eBook to PDF",
    "iwork-to-pdf": "iWork to PDF",
    "invoice-generator": "Invoice Generator",
    "timeline-gantt-generator": "Timeline & Gantt",
    "data-converter-visualizer": "Data Converter",
  };
  return map[slug] || localized || fallbackTitle;
}

function looksLikeRawSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(value.trim());
}

/** Compact card title — prefer localized fallback, then English short map. */
export function getToolCardShortLabel(slug: string, fallbackTitle: string): string {
  return getToolDisplayLabel(slug, fallbackTitle);
}

/**
 * Premium tool-card title — always English (matches bilingual card chrome).
 */
export function getToolCardEnglishLabel(slug: string, fallbackTitle?: string): string {
  // Prefer the curated English short map (ignore localized fallback).
  const fromMap = getToolDisplayLabel(slug, slug);
  if (fromMap && fromMap !== slug && !looksLikeRawSlug(fromMap)) return fromMap;

  if (fallbackTitle) {
    const stripped = stripToolLabelMarketing(fallbackTitle);
    if (stripped && /^[\x00-\x7F]+$/.test(stripped) && !looksLikeRawSlug(stripped)) {
      return stripped;
    }
  }

  // Last resort: title-case the slug.
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
