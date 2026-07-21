/**
 * SEO-oriented H1 for the tool [DOC] tab.
 * Format: "Free Online {Tool Name} (Fast & Easy)" — never duplicates Online/Free.
 */

const PREFIX_PATTERNS = [
  /^free\s+online\s+/i,
  /^best\s+(free\s+)?(online\s+)?/i,
  /^fast\s*&\s*easy\s+/i,
  /^online\s+/i,
  /^free\s+/i,
  /^бесплатн\w*\s+онлайн\s+/i,
  /^онлайн\s+/i,
  /^бесплатн\w*\s+/i,
  /^חינמי\s+אונליין\s+/,
  /^אונליין\s+/,
  /^חינמי\s+/,
];

const SUFFIX_PATTERNS = [
  /\s*\(\s*fast\s*&\s*easy\s*\)\s*$/i,
  /\s*\(\s*быстро\s+и\s+просто\s*\)\s*$/i,
  /\s*\(\s*מהיר\s+וקל\s*\)\s*$/,
  /\s*[—–-]\s*free[,.\s].*$/i,
  /\s*\|\s*free[,.\s].*$/i,
  /\s+free\s+online\s*$/i,
  /\s+online\s+free\s*$/i,
  /\s+online\s*$/i,
  /\s+free\s*$/i,
  /\s+онлайн\s+бесплатн\w*\s*$/i,
  /\s+бесплатн\w*\s+онлайн\s*$/i,
  /\s+онлайн\s*$/i,
  /\s+бесплатн\w*\s*$/i,
  /\s+חינמי\s+אונליין\s*$/,
  /\s+אונליין\s+חינמי\s*$/,
  /\s+אונליין\s*$/,
  /\s+חינמי\s*$/,
];

/** Remove standalone SEO filler words that would duplicate the H1 wrapper. */
function stripSeoNoiseWords(value: string): string {
  return value
    .replace(/\bonline\b/gi, " ")
    .replace(/\bfree\b/gi, " ")
    .replace(/\bонлайн\b/gi, " ")
    .replace(/\bбесплатн\w*\b/gi, " ")
    .replace(/אונליין/g, " ")
    .replace(/חינמי/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip prior SEO wrappers / filler so we never double-prefix titles. */
export function normalizeToolNameForDocH1(toolName: string): string {
  let value = toolName.replace(/\s+/g, " ").trim();
  if (!value) return "";

  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of PREFIX_PATTERNS) {
      const next = value.replace(pattern, "").trim();
      if (next !== value) {
        value = next;
        changed = true;
      }
    }
    for (const pattern of SUFFIX_PATTERNS) {
      const next = value.replace(pattern, "").trim();
      if (next !== value) {
        value = next;
        changed = true;
      }
    }
  }

  value = stripSeoNoiseWords(value);
  return value;
}

export const DEFAULT_DOC_H1_TEMPLATE = "Free Online {toolName} (Fast & Easy)";

/**
 * Build a converting, SEO-friendly documentation H1 from a plain tool name.
 * Safe to call repeatedly — already-formatted titles are normalized first.
 */
export function buildDocH1Title(
  toolName: string,
  template: string = DEFAULT_DOC_H1_TEMPLATE,
): string {
  const base = normalizeToolNameForDocH1(toolName);
  if (!base) return toolName.replace(/\s+/g, " ").trim();

  const safeTemplate = template.includes("{toolName}")
    ? template
    : DEFAULT_DOC_H1_TEMPLATE;

  return safeTemplate.replace(/\{toolName\}/g, base).replace(/\s+/g, " ").trim();
}
