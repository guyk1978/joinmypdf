import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getToolsInventoryEntry } from "@/data/tools-inventory";

/**
 * Per-category accent colors — shared by homepage hub cards and tool cards.
 * Mirrored as `--color-*` CSS variables in globals.css.
 */
export const CATEGORY_ACCENT_COLORS: Record<InventoryCategoryId, string> = {
  pdf: "#3b82f6",
  video: "#8b5cf6",
  mp4: "#a78bfa",
  convert: "#06b6d4",
  compress: "#14b8a6",
  extract: "#ec4899",
  image: "#f59e0b",
  jpg: "#f97316",
  png: "#eab308",
  mp3: "#f43f5e",
  audio: "#fb7185",
  favicon: "#e879f9",
  text: "#94a3b8",
  json: "#fbbf24",
  yaml: "#84cc16",
  xml: "#22d3ee",
  developer: "#10b981",
  word: "#60a5fa",
  excel: "#22c55e",
  crop: "#fb923c",
  rotate: "#818cf8",
  security: "#ef4444",
  design: "#d946ef",
  data: "#0ea5e9",
  productivity: "#94a3b8",
  "unit-math": "#a855f7",
  network: "#38bdf8",
};

export const CATEGORY_ACCENT_FALLBACK = "#3b82f6";

/** CSS custom property name for a category, e.g. `--color-pdf`. */
export function getCategoryAccentCssVarName(id: InventoryCategoryId | string): string {
  return `--color-${id}`;
}

/** `var(--color-pdf)` reference for inline styles. */
export function getCategoryAccentCssVar(id: InventoryCategoryId | string): string {
  return `var(${getCategoryAccentCssVarName(id)}, ${CATEGORY_ACCENT_FALLBACK})`;
}

export function getCategoryAccentColor(id: InventoryCategoryId | string): string {
  return (
    CATEGORY_ACCENT_COLORS[id as InventoryCategoryId] ?? CATEGORY_ACCENT_FALLBACK
  );
}

/** Black or white ink that contrasts with a solid category fill. */
export function getContrastingInk(hex: string): "#000000" | "#ffffff" {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : raw;
  if (full.length !== 6) return "#000000";

  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return "#000000";

  const toLin = (channel: number) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  return luminance > 0.42 ? "#000000" : "#ffffff";
}

/**
 * Prefer distinctive category tags for card cover colors so convert/excel/word
 * tools are not all forced to the generic PDF blue via primaryCategory.
 * First match in this list that appears on the tool wins.
 */
const TOOL_ACCENT_CATEGORY_PRIORITY: readonly InventoryCategoryId[] = [
  "excel",
  "word",
  "jpg",
  "png",
  "mp3",
  "mp4",
  "favicon",
  "crop",
  "rotate",
  "extract",
  "compress",
  "security",
  "design",
  "data",
  "developer",
  "unit-math",
  "network",
  "yaml",
  "xml",
  "json",
  "image",
  "audio",
  "video",
  "text",
  "productivity",
  "convert",
  "pdf",
] as const;

/**
 * Visual accent for cards: prefer the most distinctive category tag on the tool
 * (excel green, image amber, …) so cover fills stay distinct across hubs.
 */
export function resolveToolAccentCategoryId(
  slug?: string,
  fallback?: InventoryCategoryId,
): InventoryCategoryId | undefined {
  if (slug) {
    const entry = getToolsInventoryEntry(slug);
    if (entry) {
      const tags = new Set<InventoryCategoryId>([
        ...entry.categories,
        entry.primaryCategory,
      ]);
      for (const id of TOOL_ACCENT_CATEGORY_PRIORITY) {
        if (tags.has(id)) return id;
      }
      return entry.primaryCategory;
    }
  }
  return fallback ?? resolveToolCategoryId(slug);
}

/** Resolve accent category for a tool slug, with optional page-level fallback. */
export function resolveToolCategoryId(
  slug?: string,
  fallback?: InventoryCategoryId,
): InventoryCategoryId | undefined {
  // Prefer explicit parent/fallback (hub context) over the tool's own primary.
  if (fallback) return fallback;
  if (slug) {
    const entry = getToolsInventoryEntry(slug);
    if (entry?.primaryCategory) return entry.primaryCategory;
  }
  return undefined;
}

/** Map CategoryDirectory page ids onto inventory accent categories. */
export function directoryIdToInventoryCategory(
  directoryId: string,
): InventoryCategoryId {
  switch (directoryId) {
    case "security":
      return "security";
    case "image":
      return "image";
    case "audio":
      return "audio";
    case "developer":
      return "developer";
    case "data-conversion":
      return "data";
    case "productivity":
    case "utilities":
      return "productivity";
    case "favicon":
      return "favicon";
    case "text-json":
      return "text";
    default:
      return (directoryId as InventoryCategoryId) in CATEGORY_ACCENT_COLORS
        ? (directoryId as InventoryCategoryId)
        : "pdf";
  }
}
