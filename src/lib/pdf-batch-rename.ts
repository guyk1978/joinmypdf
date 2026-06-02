export type NumberingOptions = {
  enabled: boolean;
  start: number;
  padding: number;
  separator: string;
};

export type ReplaceOptions = {
  enabled: boolean;
  find: string;
  replaceWith: string;
};

export type BatchRenameRules = {
  prefix: string;
  suffix: string;
  useDatePrefix: boolean;
  numbering: NumberingOptions;
  replace: ReplaceOptions;
  lowercase: boolean;
  spacesToDashes: boolean;
};

export const DEFAULT_BATCH_RENAME_RULES: BatchRenameRules = {
  prefix: "",
  suffix: "",
  useDatePrefix: false,
  numbering: {
    enabled: true,
    start: 1,
    padding: 3,
    separator: "-",
  },
  replace: {
    enabled: false,
    find: "",
    replaceWith: "",
  },
  lowercase: false,
  spacesToDashes: false,
};

export type RenamePreviewRow = {
  file: File;
  originalName: string;
  newName: string;
};

function stripExtension(name: string) {
  return name.replace(/\.pdf$/i, "") || "document";
}

function sanitizeFilenamePart(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim();
}

function formatDatePrefix(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatNumber(value: number, padding: number) {
  const width = Math.max(1, Math.min(6, padding));
  return String(value).padStart(width, "0");
}

export function applyRenameRules(baseName: string, index: number, rules: BatchRenameRules): string {
  let stem = stripExtension(baseName);

  if (rules.replace.enabled && rules.replace.find) {
    stem = stem.split(rules.replace.find).join(rules.replace.replaceWith);
  }
  if (rules.lowercase) stem = stem.toLowerCase();
  if (rules.spacesToDashes) stem = stem.replace(/\s+/g, "-");
  stem = sanitizeFilenamePart(stem) || `document-${index + 1}`;

  const headParts: string[] = [];
  if (rules.useDatePrefix) headParts.push(formatDatePrefix());
  if (rules.prefix.trim()) headParts.push(sanitizeFilenamePart(rules.prefix.trim()));

  let name = stem;
  if (rules.numbering.enabled) {
    const num = formatNumber(rules.numbering.start + index, rules.numbering.padding);
    const sep = rules.numbering.separator ?? "-";
    name = `${num}${sep}${stem}`;
  }

  if (headParts.length) {
    name = `${headParts.join("-")}-${name}`;
  }

  if (rules.suffix.trim()) {
    name = `${name}-${sanitizeFilenamePart(rules.suffix.trim())}`;
  }

  name = sanitizeFilenamePart(name.replace(/-+/g, "-").replace(/^-|-$/g, ""));
  return `${name || `document-${index + 1}`}.pdf`;
}

function dedupeNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const key = name.toLowerCase();
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    if (count === 0) return name;
    const stem = stripExtension(name);
    return `${stem}_${count + 1}.pdf`;
  });
}

export function buildRenamePreview(files: File[], rules: BatchRenameRules): RenamePreviewRow[] {
  const sorted = [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
  );

  const names = sorted.map((file, index) => applyRenameRules(file.name, index, rules));
  const unique = dedupeNames(names);

  return sorted.map((file, index) => ({
    file,
    originalName: file.name,
    newName: unique[index],
  }));
}

export function batchRenameZipName() {
  return `joinmypdf-renamed-${formatDatePrefix()}.zip`;
}
