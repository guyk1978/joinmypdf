import {
  INVENTORY_HUB_META,
  type InventoryCategoryId,
} from "@/data/inventory-hubs";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import {
  TOOL_CATEGORIES as c,
  TOOL_DEFINITIONS,
  type ToolCategory,
} from "@/config/tools";
import type { ToolDefinition, ToolVariant } from "@/lib/types";
import type { ToolPageTranslator } from "@/lib/i18n-tool-page";
import type { ToolsTranslator } from "@/lib/i18n-tool-page";
import { localizedToolTitle } from "@/lib/i18n-tool-page";
import { normalizeHubPath, resolveToolHref } from "@/lib/tool-hierarchy";

export type ToolBreadcrumbCrumb = {
  name: string;
  path: string;
};

export type ToolCategoryHub = {
  path: string;
  labelKey: string;
};

/** Inventory primaryCategory → ToolPage breadcrumb label key. */
export const INVENTORY_BREADCRUMB_LABEL_KEYS: Record<InventoryCategoryId, string> = {
  pdf: "breadcrumbHubPdf",
  video: "breadcrumbHubVideo",
  mp4: "breadcrumbHubMp4",
  convert: "breadcrumbHubConvert",
  compress: "breadcrumbHubCompress",
  extract: "breadcrumbHubExtract",
  image: "breadcrumbHubImage",
  jpg: "breadcrumbHubJpg",
  png: "breadcrumbHubPng",
  mp3: "breadcrumbHubMp3",
  audio: "breadcrumbHubMp3",
  favicon: "breadcrumbHubFavicon",
  text: "breadcrumbHubText",
  json: "breadcrumbHubJson",
  yaml: "breadcrumbHubYaml",
  xml: "breadcrumbHubXml",
  developer: "breadcrumbHubDeveloper",
  word: "breadcrumbHubWord",
  excel: "breadcrumbHubExcel",
  crop: "breadcrumbHubCrop",
  rotate: "breadcrumbHubRotate",
  security: "breadcrumbHubSecurity",
  design: "breadcrumbHubDesign",
  data: "breadcrumbHubDataConversion",
  productivity: "breadcrumbHubProductivity",
  "unit-math": "breadcrumbHubUnitMath",
  network: "breadcrumbHubNetwork",
};

/** Nav category → category hub URL (legacy fallback when inventory miss). */
const NAV_CATEGORY_HUBS: Partial<Record<ToolCategory, ToolCategoryHub>> = {
  [c.favicon]: { path: "/tools/favicon-tools/", labelKey: "breadcrumbHubFavicon" },
  [c.image]: { path: "/tools/image-tools/", labelKey: "breadcrumbHubImage" },
  [c.video]: { path: "/tools/video-tools/", labelKey: "breadcrumbHubVideo" },
  [c.developerBrowser]: { path: "/tools/developer-tools/", labelKey: "breadcrumbHubDeveloper" },
  [c.developerTokens]: { path: "/tools/developer-tools/", labelKey: "breadcrumbHubDeveloper" },
  [c.developerGenerators]: { path: "/tools/developer-tools/", labelKey: "breadcrumbHubDeveloper" },
  [c.developerJson]: { path: "/tools/json-tools/", labelKey: "breadcrumbHubJson" },
  [c.developerPublish]: { path: "/tools/developer-tools/", labelKey: "breadcrumbHubDeveloper" },
  [c.developerWorkflows]: { path: "/tools/developer-tools/", labelKey: "breadcrumbHubDeveloper" },
  [c.utilitiesText]: { path: "/tools/text-tools/", labelKey: "breadcrumbHubText" },
  [c.utilitiesEncoders]: { path: "/tools/text-tools/", labelKey: "breadcrumbHubText" },
  [c.dataConversion]: { path: "/tools/data-conversion-tools/", labelKey: "breadcrumbHubDataConversion" },
  [c.security]: { path: "/tools/security-tools/", labelKey: "breadcrumbHubSecurity" },
  [c.productivity]: { path: "/tools/productivity-tools/", labelKey: "breadcrumbHubProductivity" },
  [c.design]: { path: "/tools/developer-tools/", labelKey: "breadcrumbHubDesign" },
  [c.pdfSecurity]: { path: "/tools/pdf-tools/", labelKey: "breadcrumbHubPdf" },
  [c.pdfEdit]: { path: "/tools/pdf-tools/", labelKey: "breadcrumbHubPdf" },
  [c.pdfConvertIn]: { path: "/tools/pdf-tools/", labelKey: "breadcrumbHubPdf" },
  [c.pdfExport]: { path: "/tools/pdf-tools/", labelKey: "breadcrumbHubPdf" },
  [c.compress]: { path: "/tools/compress-tools/", labelKey: "breadcrumbHubCompress" },
};

const NAV_CATEGORY_PRIORITY: ToolCategory[] = [
  c.favicon,
  c.video,
  c.image,
  c.dataConversion,
  c.developerJson,
  c.developerBrowser,
  c.developerTokens,
  c.developerGenerators,
  c.developerPublish,
  c.developerWorkflows,
  c.utilitiesEncoders,
  c.utilitiesText,
  c.security,
  c.productivity,
  c.design,
  c.pdfSecurity,
  c.pdfEdit,
  c.pdfConvertIn,
  c.pdfExport,
  c.compress,
];

const SEO_CATEGORY_HUBS: Record<string, ToolCategoryHub> = {
  convert: { path: "/tools/convert-tools/", labelKey: "breadcrumbHubConvert" },
  edit: { path: "/tools/", labelKey: "breadcrumbHubEdit" },
  optimize: { path: "/tools/compress-tools/", labelKey: "breadcrumbHubCompress" },
  security: { path: "/tools/developer-tools/", labelKey: "breadcrumbHubDeveloper" },
};

function pickNavCategoryHub(categories: ToolCategory[]): ToolCategoryHub | null {
  for (const category of NAV_CATEGORY_PRIORITY) {
    if (categories.includes(category) && NAV_CATEGORY_HUBS[category]) {
      return NAV_CATEGORY_HUBS[category]!;
    }
  }
  return null;
}

function resolveInventoryHub(
  slug: string,
  categoryOverride?: InventoryCategoryId,
): ToolCategoryHub | null {
  const category =
    categoryOverride ?? getToolsInventoryEntry(slug)?.primaryCategory;
  if (!category) return null;
  return {
    path: normalizeHubPath(category),
    labelKey: INVENTORY_BREADCRUMB_LABEL_KEYS[category],
  };
}

/** Resolve the category hub — inventory primaryCategory first, then nav/SEO fallbacks. */
export function resolveToolCategoryHub(
  slug: string,
  seoCategory = "convert",
  categoryOverride?: InventoryCategoryId,
): ToolCategoryHub {
  const inventoryHub = resolveInventoryHub(slug, categoryOverride);
  if (inventoryHub) return inventoryHub;

  const definition = TOOL_DEFINITIONS.find((entry) => entry.slug === slug);
  if (definition) {
    const navHub = pickNavCategoryHub(definition.categories);
    if (navHub) return navHub;
  }

  return SEO_CATEGORY_HUBS[seoCategory] ?? { path: "/tools/", labelKey: "breadcrumbAllTools" };
}

function resolveHubLabel(tPage: ToolPageTranslator, hub: ToolCategoryHub): string {
  if (tPage.has(hub.labelKey)) return tPage(hub.labelKey);
  const entry = Object.entries(INVENTORY_BREADCRUMB_LABEL_KEYS).find(([, key]) => key === hub.labelKey);
  if (entry) {
    const category = entry[0] as InventoryCategoryId;
    return INVENTORY_HUB_META[category].title;
  }
  return hub.labelKey;
}

/**
 * Canonical trail: Home / All tools / [Category hub] / [Tool].
 * Prefer parent category context when provided, else inventory primaryCategory.
 */
export function buildToolPageBreadcrumbs(params: {
  slug: string;
  toolTitle: string;
  toolPath?: string;
  seoCategory?: string;
  categoryId?: InventoryCategoryId;
  locale?: string;
  tPage: ToolPageTranslator;
}): ToolBreadcrumbCrumb[] {
  const { slug, toolTitle, tPage } = params;
  const hub = resolveToolCategoryHub(
    slug,
    params.seoCategory ?? "convert",
    params.categoryId,
  );
  const categoryForPath =
    params.categoryId ?? getToolsInventoryEntry(slug)?.primaryCategory;
  const toolPath =
    params.toolPath ??
    (categoryForPath
      ? resolveToolHref(slug, categoryForPath, params.locale)
      : `/tools/${slug}/`);

  return [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: resolveHubLabel(tPage, hub), path: hub.path },
    { name: toolTitle, path: toolPath },
  ];
}

export function buildToolBreadcrumbTrail(params: {
  tool: ToolDefinition;
  variant: ToolVariant | null;
  pathname: string;
  tPage: ToolPageTranslator;
  tTools: ToolsTranslator;
  categoryId?: InventoryCategoryId;
  locale?: string;
}): ToolBreadcrumbCrumb[] {
  const { tool, variant, pathname, tPage, tTools } = params;
  const crumbs = buildToolPageBreadcrumbs({
    slug: tool.slug,
    toolTitle: localizedToolTitle(tTools, tool, null),
    categoryId: params.categoryId,
    seoCategory: tool.category,
    locale: params.locale,
    toolPath: pathname,
    tPage,
  });

  if (variant) {
    crumbs.push({ name: variant.keyword, path: pathname });
  }

  return crumbs;
}

/** Normalize for duplicate title/subcopy detection. */
export function normalizeToolPageCopy(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Single sub-headline under the H1: prefer SEO hero tagline, else intent when distinct from title.
 */
export function resolveToolPageDescription(params: {
  title: string;
  intent?: string | null;
  heroTagline?: string | null;
}): string | undefined {
  const titleNorm = normalizeToolPageCopy(params.title);
  const hero = params.heroTagline?.trim();
  if (hero && normalizeToolPageCopy(hero) !== titleNorm) return hero;

  const intent = params.intent?.trim();
  if (intent && normalizeToolPageCopy(intent) !== titleNorm) return intent;

  return undefined;
}
