import {
  TOOL_CATEGORIES as c,
  TOOL_DEFINITIONS,
  type ToolCategory,
} from "@/config/tools";
import type { ToolDefinition, ToolVariant } from "@/lib/types";
import type { ToolPageTranslator } from "@/lib/i18n-tool-page";
import type { ToolsTranslator } from "@/lib/i18n-tool-page";
import { localizedToolTitle } from "@/lib/i18n-tool-page";

export type ToolBreadcrumbCrumb = {
  name: string;
  path: string;
};

export type ToolCategoryHub = {
  path: string;
  labelKey: string;
};

/** Nav category → category hub URL (aligned with `tools.ts` + directory pages). */
const NAV_CATEGORY_HUBS: Partial<Record<ToolCategory, ToolCategoryHub>> = {
  [c.favicon]: { path: "/favicon-tools/", labelKey: "breadcrumbHubFavicon" },
  [c.image]: { path: "/image-tools/", labelKey: "breadcrumbHubImage" },
  [c.video]: { path: "/image-tools/", labelKey: "breadcrumbHubImage" },
  [c.developerBrowser]: { path: "/developer-tools/", labelKey: "breadcrumbHubDeveloper" },
  [c.developerTokens]: { path: "/developer-tools/", labelKey: "breadcrumbHubDeveloper" },
  [c.developerGenerators]: { path: "/developer-tools/", labelKey: "breadcrumbHubDeveloper" },
  [c.developerJson]: { path: "/text-json-tools/", labelKey: "breadcrumbHubTextJson" },
  [c.developerPublish]: { path: "/developer-tools/", labelKey: "breadcrumbHubDeveloper" },
  [c.developerWorkflows]: { path: "/developer-tools/", labelKey: "breadcrumbHubDeveloper" },
  [c.utilitiesEncoders]: { path: "/utilities/", labelKey: "breadcrumbHubUtilities" },
  [c.utilitiesText]: { path: "/utilities/", labelKey: "breadcrumbHubUtilities" },
  [c.dataConversion]: { path: "/data-conversion-tools/", labelKey: "breadcrumbHubDataConversion" },
  [c.security]: { path: "/security-tools/", labelKey: "breadcrumbHubSecurity" },
  [c.productivity]: { path: "/productivity-tools/", labelKey: "breadcrumbHubProductivity" },
  [c.pdfSecurity]: { path: "/privacy-first-pdf-tools/", labelKey: "breadcrumbHubPdf" },
  [c.pdfEdit]: { path: "/privacy-first-pdf-tools/", labelKey: "breadcrumbHubPdf" },
  [c.pdfConvertIn]: { path: "/privacy-first-pdf-tools/", labelKey: "breadcrumbHubPdf" },
  [c.pdfExport]: { path: "/privacy-first-pdf-tools/", labelKey: "breadcrumbHubPdf" },
  [c.compress]: { path: "/tools/", labelKey: "breadcrumbHubOptimize" },
};

/** When a tool has multiple nav categories, pick the most specific hub first. */
const NAV_CATEGORY_PRIORITY: ToolCategory[] = [
  c.favicon,
  c.image,
  c.video,
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
  c.pdfSecurity,
  c.pdfEdit,
  c.pdfConvertIn,
  c.pdfExport,
  c.compress,
];

/** Fallback hubs from `tools.json` SEO categories. */
const SEO_CATEGORY_HUBS: Record<string, ToolCategoryHub> = {
  convert: { path: "/tools/", labelKey: "breadcrumbHubConvert" },
  edit: { path: "/tools/", labelKey: "breadcrumbHubEdit" },
  optimize: { path: "/tools/", labelKey: "breadcrumbHubOptimize" },
  security: { path: "/security-tools/", labelKey: "breadcrumbHubSecurity" },
};

function pickNavCategoryHub(categories: ToolCategory[]): ToolCategoryHub | null {
  for (const category of NAV_CATEGORY_PRIORITY) {
    if (categories.includes(category) && NAV_CATEGORY_HUBS[category]) {
      return NAV_CATEGORY_HUBS[category]!;
    }
  }
  return null;
}

/** Resolve the category hub for a tool slug using `tools.ts`, then `tools.json` category. */
export function resolveToolCategoryHub(slug: string, seoCategory: string): ToolCategoryHub {
  const definition = TOOL_DEFINITIONS.find((entry) => entry.slug === slug);
  if (definition) {
    const navHub = pickNavCategoryHub(definition.categories);
    if (navHub) return navHub;
  }

  return SEO_CATEGORY_HUBS[seoCategory] ?? { path: "/tools/", labelKey: "breadcrumbAllTools" };
}

export function buildToolBreadcrumbTrail(params: {
  tool: ToolDefinition;
  variant: ToolVariant | null;
  pathname: string;
  tPage: ToolPageTranslator;
  tTools: ToolsTranslator;
}): ToolBreadcrumbCrumb[] {
  const { tool, variant, pathname, tPage, tTools } = params;
  const hub = resolveToolCategoryHub(tool.slug, tool.category);
  const hubLabel = tPage.has(hub.labelKey) ? tPage(hub.labelKey) : hub.labelKey;

  const crumbs: ToolBreadcrumbCrumb[] = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: hubLabel, path: hub.path },
    {
      name: localizedToolTitle(tTools, tool, null),
      path: `/tools/${tool.slug}/`,
    },
  ];

  if (variant) {
    crumbs.push({ name: variant.keyword, path: pathname });
  }

  return crumbs;
}
