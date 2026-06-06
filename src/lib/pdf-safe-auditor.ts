import { loadPdfDocument } from "./pdf-text-extract";
import { classifyPdfError } from "./pdf-errors";
import type { NormalizedRedactionRect } from "./pdf-redact";

export type AuditSeverity = "high" | "medium" | "low";
export type AuditFindingKind = "regex" | "annotation" | "signature" | "hidden-comment";

export type AuditFinding = {
  id: string;
  pageIndex: number;
  kind: AuditFindingKind;
  label: string;
  severity: AuditSeverity;
  nx: number;
  ny: number;
  nw: number;
  nh: number;
  excerpt?: string;
  patternId?: string;
  findingKey?: "hidden-signature" | "signature-ink" | "hidden-comment" | "visible-comment";
  annotationSubtype?: string;
};

export type AuditReport = {
  pageCount: number;
  findings: AuditFinding[];
  byKind: Record<AuditFindingKind, number>;
  bySeverity: Record<AuditSeverity, number>;
};

type NormRect = { nx: number; ny: number; nw: number; nh: number };

type SensitivePattern = {
  id: string;
  label: string;
  severity: AuditSeverity;
  regex: RegExp;
  test?: (match: string) => boolean;
};

type PdfTextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
};

type PdfAnnotation = {
  subtype?: string;
  annotationType?: number;
  rect?: number[];
  contents?: string;
  title?: string;
  fieldType?: string;
  fieldName?: string;
  annotationFlags?: number;
  hasAppearance?: boolean;
};

const ANNOT_FLAG_HIDDEN = 1;
const ANNOT_FLAG_NO_VIEW = 32;
const ANNOT_FLAG_INVISIBLE = 2;

export const SENSITIVE_PATTERNS: SensitivePattern[] = [
  {
    id: "credit-card",
    label: "Credit / debit card number",
    severity: "high",
    regex: /\b(?:\d[ \-]?){13,19}\d\b/,
    test: (m) => luhnValid(m.replace(/\D/g, "")),
  },
  {
    id: "ssn",
    label: "US Social Security number",
    severity: "high",
    regex: /\b\d{3}-\d{2}-\d{4}\b/,
  },
  {
    id: "israel-id",
    label: "Israeli ID number (ת.ז)",
    severity: "high",
    regex: /\b\d{9}\b/,
    test: (m) => israeliIdChecksum(m.replace(/\D/g, "")),
  },
  {
    id: "id-label-he",
    label: "ID label (ת.ז / תעודת זהות)",
    severity: "high",
    regex: /ת\.?\s*ז\.?|תעודת\s*זהות|מספר\s*זהות/i,
  },
  {
    id: "iban",
    label: "IBAN / bank account",
    severity: "high",
    regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/,
  },
  {
    id: "email",
    label: "Email address",
    severity: "medium",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  },
  {
    id: "phone",
    label: "Phone number",
    severity: "medium",
    regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/,
  },
  {
    id: "confidential-en",
    label: "Confidential marker",
    severity: "medium",
    regex: /\b(confidential|secret|classified|privileged|internal use only|top secret)\b/i,
  },
  {
    id: "confidential-he",
    label: "Hebrew confidential marker",
    severity: "medium",
    regex: /סודי|לשימוש פנימי|חסוי|אישי בלבד/,
  },
  {
    id: "password",
    label: "Password / credential label",
    severity: "high",
    regex: /\b(password|passwd|api[_-]?key|secret[_-]?key)\s*[:=]\s*\S+/i,
  },
  {
    id: "signature-text",
    label: "Signature block text",
    severity: "low",
    regex: /\b(signature|signed by|digitally signed|חתימה|נחתם)\b/i,
  },
];

function luhnValid(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function israeliIdChecksum(id: string): boolean {
  if (id.length !== 9 || !/^\d+$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    let digit = Number(id[i]) * ((i % 2) + 1);
    if (digit > 9) digit -= 9;
    sum += digit;
  }
  return sum % 10 === 0;
}

function textItemNormRect(
  item: PdfTextItem,
  viewport: { width: number; height: number; convertToViewportPoint: (x: number, y: number) => number[] },
): NormRect {
  const fontHeight = Math.hypot(item.transform[2] ?? 0, item.transform[3] ?? 0) || 12;
  const w = item.width || item.str.length * fontHeight * 0.45;
  const h = item.height || fontHeight;
  const px = item.transform[4] ?? 0;
  const py = item.transform[5] ?? 0;
  const corners: [number, number][] = [
    [px, py],
    [px + w, py],
    [px, py + h],
    [px + w, py + h],
  ];
  const mapped = corners.map(([x, y]) => viewport.convertToViewportPoint(x, y));
  const xs = mapped.map((p) => p[0] ?? 0);
  const ys = mapped.map((p) => p[1] ?? 0);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const pad = 3;
  return {
    nx: Math.max(0, (left - pad) / viewport.width),
    ny: Math.max(0, (top - pad) / viewport.height),
    nw: Math.min(1, (right - left + pad * 2) / viewport.width),
    nh: Math.min(1, (bottom - top + pad * 2) / viewport.height),
  };
}

function pdfRectToNorm(rect: number[], viewport: { width: number; height: number; convertToViewportPoint: (x: number, y: number) => number[] }): NormRect | null {
  if (!rect || rect.length < 4) return null;
  const pts = [
    viewport.convertToViewportPoint(rect[0], rect[1]),
    viewport.convertToViewportPoint(rect[2], rect[3]),
  ];
  const xs = pts.map((p) => p[0] ?? 0);
  const ys = pts.map((p) => p[1] ?? 0);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const w = right - left;
  const h = bottom - top;
  if (w < 2 || h < 2) return null;
  const pad = 4;
  return {
    nx: Math.max(0, (left - pad) / viewport.width),
    ny: Math.max(0, (top - pad) / viewport.height),
    nw: Math.min(1, (w + pad * 2) / viewport.width),
    nh: Math.min(1, (h + pad * 2) / viewport.height),
  };
}

function annotationNormRect(
  annotation: PdfAnnotation,
  viewport: { width: number; height: number; convertToViewportPoint: (x: number, y: number) => number[] },
): NormRect | null {
  const rect = annotation.rect;
  if (!rect) return null;
  return pdfRectToNorm(rect, viewport);
}

function isHiddenAnnotation(annotation: PdfAnnotation): boolean {
  const flags = annotation.annotationFlags ?? 0;
  return Boolean(flags & ANNOT_FLAG_HIDDEN || flags & ANNOT_FLAG_NO_VIEW || flags & ANNOT_FLAG_INVISIBLE);
}

function isSignatureAnnotation(annotation: PdfAnnotation): boolean {
  const subtype = (annotation.subtype || "").toLowerCase();
  const fieldType = (annotation.fieldType || "").toLowerCase();
  const fieldName = (annotation.fieldName || "").toLowerCase();
  if (subtype === "widget" && (fieldType === "sig" || fieldName.includes("sign"))) return true;
  if (subtype === "stamp" && fieldName.includes("sign")) return true;
  if (subtype === "ink") return true;
  return false;
}

function isCommentAnnotation(annotation: PdfAnnotation): boolean {
  const subtype = (annotation.subtype || "").toLowerCase();
  return ["text", "freetext", "popup", "highlight", "underline", "squiggly", "strikeout", "caret"].includes(
    subtype,
  );
}

let findingCounter = 0;
function nextFindingId(): string {
  findingCounter += 1;
  return `f-${findingCounter}`;
}

function scanTextOnPage(
  pageIndex: number,
  content: { items: unknown[] },
  viewport: { width: number; height: number; convertToViewportPoint: (x: number, y: number) => number[] },
): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const raw of content.items) {
    if (typeof raw !== "object" || raw === null || !("str" in raw)) continue;
    const item = raw as PdfTextItem;
    if (typeof item.str !== "string") continue;
    const text = item.str;
    if (!text.trim()) continue;

    for (const pattern of SENSITIVE_PATTERNS) {
      const re = new RegExp(pattern.regex.source, pattern.regex.flags.includes("g") ? pattern.regex.flags : `${pattern.regex.flags}g`);
      let match: RegExpExecArray | null;
      while ((match = re.exec(text)) !== null) {
        const value = match[0];
        if (pattern.test && !pattern.test(value)) continue;
        const rect = textItemNormRect(item, viewport);
        findings.push({
          id: nextFindingId(),
          pageIndex,
          kind: "regex",
          label: pattern.label,
          patternId: pattern.id,
          severity: pattern.severity,
          excerpt: value.slice(0, 80),
          ...rect,
        });
      }
    }
  }

  return findings;
}

async function scanAnnotationsOnPage(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof loadPdfDocument>>["getPage"]>>,
  pageIndex: number,
): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];
  const viewport = page.getViewport({ scale: 1 });
  let annotations: PdfAnnotation[] = [];
  try {
    annotations = (await page.getAnnotations()) as PdfAnnotation[];
  } catch {
    return findings;
  }

  for (const annotation of annotations) {
    const subtypeLower = (annotation.subtype || "").toLowerCase();
    if (subtypeLower === "link") continue;

    const rect = annotationNormRect(annotation, viewport);
    if (!rect) continue;
    const contents = (annotation.contents || annotation.title || "").trim();
    const hidden = isHiddenAnnotation(annotation);

    if (isSignatureAnnotation(annotation)) {
      findings.push({
        id: nextFindingId(),
        pageIndex,
        kind: "signature",
        label: hidden ? "Hidden signature field" : "Signature or ink markup",
        findingKey: hidden ? "hidden-signature" : "signature-ink",
        severity: "high",
        excerpt: contents || annotation.fieldName,
        ...rect,
      });
      continue;
    }

    if (isCommentAnnotation(annotation) || contents) {
      const subtype = (annotation.subtype || "Note").toString();
      findings.push({
        id: nextFindingId(),
        pageIndex,
        kind: hidden ? "hidden-comment" : "annotation",
        label: hidden ? `Hidden ${subtype} comment` : `${subtype} annotation`,
        findingKey: hidden ? "hidden-comment" : "visible-comment",
        annotationSubtype: subtype,
        severity: hidden ? "high" : "medium",
        excerpt: contents.slice(0, 120) || undefined,
        ...rect,
      });
    }
  }

  return findings;
}

function dedupeFindings(findings: AuditFinding[]): AuditFinding[] {
  const out: AuditFinding[] = [];
  for (const f of findings) {
    const dup = out.find(
      (o) =>
        o.pageIndex === f.pageIndex &&
        o.kind === f.kind &&
        o.label === f.label &&
        Math.abs(o.nx - f.nx) < 0.02 &&
        Math.abs(o.ny - f.ny) < 0.02,
    );
    if (!dup) out.push(f);
  }
  return out;
}

function summarize(findings: AuditFinding[]): Pick<AuditReport, "byKind" | "bySeverity"> {
  const byKind: Record<AuditFindingKind, number> = {
    regex: 0,
    annotation: 0,
    signature: 0,
    "hidden-comment": 0,
  };
  const bySeverity: Record<AuditSeverity, number> = { high: 0, medium: 0, low: 0 };
  for (const f of findings) {
    byKind[f.kind] += 1;
    bySeverity[f.severity] += 1;
  }
  return { byKind, bySeverity };
}

export type AuditProgress = {
  phase: "loading" | "scanning";
  currentPage: number;
  totalPages: number;
};

export async function auditPdfFile(
  file: File,
  onProgress?: (p: AuditProgress) => void,
): Promise<AuditReport> {
  findingCounter = 0;
  try {
    onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });
    const doc = await loadPdfDocument(file);
    const pageCount = doc.numPages;
    const all: AuditFinding[] = [];

    for (let i = 1; i <= pageCount; i += 1) {
      onProgress?.({ phase: "scanning", currentPage: i, totalPages: pageCount });
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      all.push(...scanTextOnPage(i - 1, content, viewport));
      all.push(...(await scanAnnotationsOnPage(page, i - 1)));
    }

    await doc.destroy();
    const findings = dedupeFindings(all);
    const summary = summarize(findings);
    return { pageCount, findings, ...summary };
  } catch (e) {
    throw classifyPdfError(e);
  }
}

export function findingsToRedactionRects(findings: AuditFinding[]): NormalizedRedactionRect[] {
  return findings.map((f) => ({
    pageIndex: f.pageIndex,
    nx: f.nx,
    ny: f.ny,
    nw: f.nw,
    nh: f.nh,
  }));
}

export function auditorRedactOutputName(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-safe-redacted.pdf`;
}

export function kindLabel(kind: AuditFindingKind): string {
  const map: Record<AuditFindingKind, string> = {
    regex: "Pattern match",
    annotation: "Annotation",
    signature: "Signature",
    "hidden-comment": "Hidden comment",
  };
  return map[kind];
}
