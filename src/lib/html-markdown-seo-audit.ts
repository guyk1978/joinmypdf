export type SeoAuditSeverity = "good" | "warning" | "error";

export type SeoAuditFinding = {
  id: string;
  severity: SeoAuditSeverity;
  messageKey: string;
  detail?: string;
};

const LONG_PARAGRAPH_CHARS = 1200;
const HEADING_COUNT_WARN = 30;

export function auditHtmlForSeo(html: string): SeoAuditFinding[] {
  const trimmed = html.trim();
  if (!trimmed) {
    return [{ id: "empty", severity: "warning", messageKey: "seoNoHtml" }];
  }

  if (typeof DOMParser === "undefined") {
    return [];
  }

  const findings: SeoAuditFinding[] = [];
  const doc = new DOMParser().parseFromString(trimmed, "text/html");
  const body = doc.body;

  const h1s = body.querySelectorAll("h1");
  if (h1s.length === 0) {
    findings.push({ id: "h1-missing", severity: "error", messageKey: "seoH1Missing" });
  } else if (h1s.length > 1) {
    findings.push({
      id: "h1-multiple",
      severity: "warning",
      messageKey: "seoH1Multiple",
      detail: String(h1s.length),
    });
  }

  const headings = Array.from(body.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  if (headings.length > HEADING_COUNT_WARN) {
    findings.push({
      id: "headings-many",
      severity: "warning",
      messageKey: "seoTooManyHeadings",
      detail: String(headings.length),
    });
  }

  let lastLevel = 0;
  let headingSkipReported = false;
  for (const heading of headings) {
    const level = Number(heading.tagName.slice(1));
    if (lastLevel > 0 && level > lastLevel + 1 && !headingSkipReported) {
      findings.push({
        id: "heading-skip",
        severity: "warning",
        messageKey: "seoHeadingSkip",
        detail: `h${lastLevel}→h${level}`,
      });
      headingSkipReported = true;
    }
    lastLevel = level;
  }

  const imgsWithoutAlt = Array.from(body.querySelectorAll("img")).filter(
    (img) => !img.hasAttribute("alt") || img.getAttribute("alt")?.trim() === "",
  );
  if (imgsWithoutAlt.length > 0) {
    findings.push({
      id: "img-alt",
      severity: "error",
      messageKey: "seoImgMissingAlt",
      detail: String(imgsWithoutAlt.length),
    });
  }

  const longParas = Array.from(body.querySelectorAll("p")).filter(
    (p) => (p.textContent?.trim().length ?? 0) > LONG_PARAGRAPH_CHARS,
  );
  if (longParas.length > 0) {
    findings.push({
      id: "long-para",
      severity: "warning",
      messageKey: "seoLongParagraph",
      detail: String(longParas.length),
    });
  }

  if (findings.length === 0) {
    findings.push({ id: "good", severity: "good", messageKey: "seoStructureGood" });
  }

  return findings;
}
