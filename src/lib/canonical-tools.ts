import { TOOL_CATEGORIES, TOOL_DEFINITIONS, type ToolCategory } from "@/config/tools";
import { AUDIO_TOOLS_META } from "@/data/audio-tools-meta";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { HOME_DATA_CONVERSION_TOOL_IDS } from "@/lib/data-conversion-tools";
import { HOME_DEVELOPER_TOOL_IDS } from "@/lib/developer-tools";
import { HOME_FAVICON_TOOL_IDS } from "@/lib/favicon-tools";
import { getImageToolSlugs } from "@/lib/image-tools";
import { HOME_DESIGN_TOOL_IDS } from "@/lib/design-tools";
import { HOME_PRODUCTIVITY_TOOL_IDS } from "@/lib/productivity-tools";
import { HOME_SECURITY_TOOL_IDS } from "@/lib/security-tools";
import { HOME_TEXT_JSON_TOOL_IDS } from "@/lib/text-json-tools";
import { registry } from "@/lib/registry";
import { STUDIO_TOOLS } from "@/lib/studio-tools";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import type { InventoryCategoryId } from "@/data/inventory-hubs";

export type CanonicalToolCategory =
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "developer"
  | "data"
  | "security"
  | "productivity"
  | "design"
  | "utilities";

export type CanonicalToolSource =
  | "tools.json"
  | "tool-definitions"
  | "audio-registry"
  | "studio-tools";

export type CanonicalTool = {
  slug: string;
  title: string;
  description: string;
  category: CanonicalToolCategory;
  path: string;
  sources: CanonicalToolSource[];
  updatedAt: string | null;
  priority: number;
};

const CATEGORY_SLUG_MAP = new Map<string, CanonicalToolCategory>();

function registerCategorySlugs(ids: readonly string[], category: CanonicalToolCategory) {
  for (const id of ids) {
    if (!CATEGORY_SLUG_MAP.has(id)) CATEGORY_SLUG_MAP.set(id, category);
  }
}

registerCategorySlugs(getImageToolSlugs(), "image");
registerCategorySlugs(HOME_DEVELOPER_TOOL_IDS, "developer");
registerCategorySlugs(HOME_DATA_CONVERSION_TOOL_IDS, "data");
registerCategorySlugs(HOME_SECURITY_TOOL_IDS, "security");
registerCategorySlugs(HOME_PRODUCTIVITY_TOOL_IDS, "productivity");
registerCategorySlugs(HOME_DESIGN_TOOL_IDS, "design");
registerCategorySlugs(HOME_FAVICON_TOOL_IDS, "utilities");
registerCategorySlugs(HOME_TEXT_JSON_TOOL_IDS, "utilities");
registerCategorySlugs(
  [
    "video-to-mp4",
    "video-converter",
    "video-compressor",
    "video-resizer",
    "video-rotator",
    "video-speed-controller",
    "video-speed",
    "video-to-gif",
    "video-trimmer",
    "video-to-mp3",
    "video-muter",
    "video-metadata-cleaner",
  ],
  "video",
);
registerCategorySlugs(
  AUDIO_TOOLS_META.map((tool) => tool.slug),
  "audio",
);

function categoryFromNav(categories: readonly ToolCategory[]): CanonicalToolCategory | null {
  if (categories.includes(TOOL_CATEGORIES.video)) return "video";
  if (categories.includes(TOOL_CATEGORIES.image)) return "image";
  if (categories.includes(TOOL_CATEGORIES.favicon)) return "utilities";
  if (categories.includes(TOOL_CATEGORIES.dataConversion)) return "data";
  if (categories.includes(TOOL_CATEGORIES.security)) return "security";
  if (categories.includes(TOOL_CATEGORIES.productivity)) return "productivity";
  if (categories.includes(TOOL_CATEGORIES.design)) return "design";
  if (
    categories.includes(TOOL_CATEGORIES.utilitiesEncoders) ||
    categories.includes(TOOL_CATEGORIES.utilitiesText)
  ) {
    return "utilities";
  }
  if (categories.some((entry) => entry.startsWith("developer"))) {
    return "developer";
  }
  if (categories.some((entry) => entry.startsWith("pdf") || entry === TOOL_CATEGORIES.compress)) {
    return "pdf";
  }
  return null;
}

function resolveCategory(slug: string, navCategories?: readonly ToolCategory[]): CanonicalToolCategory {
  const mapped = CATEGORY_SLUG_MAP.get(slug);
  if (mapped) return mapped;
  if (navCategories) {
    const fromNav = categoryFromNav(navCategories);
    if (fromNav) return fromNav;
  }
  return "pdf";
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveCanonicalPath(slug: string): string {
  const entry = getToolsInventoryEntry(slug);
  if (entry?.primaryCategory) {
    return resolveToolHref(slug, entry.primaryCategory);
  }
  // Fall back to coarse canonical category → inventory hub when possible.
  const coarse = resolveCategory(slug);
  const coarseToInventory: Partial<Record<CanonicalToolCategory, InventoryCategoryId>> = {
    pdf: "pdf",
    image: "image",
    video: "video",
    audio: "mp3",
    developer: "developer",
    data: "data",
    security: "security",
    productivity: "productivity",
    design: "design",
    utilities: "productivity",
  };
  const inventoryCategory = coarseToInventory[coarse];
  return inventoryCategory
    ? resolveToolHref(slug, inventoryCategory)
    : `/tools/${slug}/`;
}

/**
 * Unified product tool catalog — merges SEO registry, nav definitions,
 * audio module registry, and studio apps. Missing entries are appended
 * with inferred metadata so inventory/sitemap stay complete.
 *
 * `path` is always the nested hierarchy URL from tool-hierarchy
 * (e.g. `/tools/image-tools/heic-to-jpg/`).
 */
export function getCanonicalTools(): CanonicalTool[] {
  const bySlug = new Map<string, CanonicalTool>();

  const upsert = (partial: {
    slug: string;
    title?: string;
    description?: string;
    category?: CanonicalToolCategory;
    source: CanonicalToolSource;
    updatedAt?: string | null;
    priority?: number | null;
  }) => {
    const existing = bySlug.get(partial.slug);
    if (!existing) {
      bySlug.set(partial.slug, {
        slug: partial.slug,
        title: partial.title?.trim() || titleFromSlug(partial.slug),
        description: partial.description?.trim() || "",
        category: partial.category ?? resolveCategory(partial.slug),
        path: resolveCanonicalPath(partial.slug),
        sources: [partial.source],
        updatedAt: partial.updatedAt ?? null,
        priority:
          partial.priority != null && Number.isFinite(Number(partial.priority))
            ? Number(partial.priority)
            : 0.9,
      });
      return;
    }

    if (!existing.sources.includes(partial.source)) {
      existing.sources.push(partial.source);
    }
    if (partial.title?.trim() && (existing.title === titleFromSlug(partial.slug) || !existing.title)) {
      existing.title = partial.title.trim();
    }
    if (partial.description?.trim() && !existing.description) {
      existing.description = partial.description.trim();
    }
    if (partial.updatedAt && !existing.updatedAt) {
      existing.updatedAt = partial.updatedAt;
    }
    if (partial.priority != null && Number.isFinite(Number(partial.priority))) {
      existing.priority = Number(partial.priority);
    }
    if (partial.category) {
      existing.category = partial.category;
    }
    // Keep path aligned with hierarchy even if category metadata updates later.
    existing.path = resolveCanonicalPath(partial.slug);
  };

  for (const tool of registry.tools) {
    upsert({
      slug: tool.slug,
      title: tool.title,
      description: tool.description,
      category: resolveCategory(tool.slug),
      source: "tools.json",
      updatedAt: tool.updatedAt ?? null,
      priority: tool.priority ?? 0.9,
    });
  }

  for (const def of TOOL_DEFINITIONS) {
    const existing = bySlug.get(def.slug);
    upsert({
      slug: def.slug,
      title: existing?.title,
      description: existing?.description,
      category: resolveCategory(def.slug, def.categories),
      source: "tool-definitions",
    });
  }

  for (const audio of AUDIO_TOOLS_META) {
    upsert({
      slug: audio.slug,
      title: audio.title,
      description: audio.description,
      category: "audio",
      source: "audio-registry",
      priority: 0.88,
    });
  }

  for (const studio of STUDIO_TOOLS) {
    upsert({
      slug: studio.slug,
      title: studio.title,
      description: studio.subtitle,
      category: resolveCategory(studio.slug),
      source: "studio-tools",
      priority: 0.92,
    });
  }

  return Array.from(bySlug.values()).sort((a, b) => a.title.localeCompare(b.title));
}

export function getCanonicalToolSlugs(): string[] {
  return getCanonicalTools().map((tool) => tool.slug);
}
