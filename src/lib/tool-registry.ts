import {
  FOOTER_PANEL_GROUPS,
  ALL_TOOLS_REGISTRY,
  HEADER_CATEGORY_BUTTONS,
  TOOL_DEFINITIONS,
  toolPath,
  type HeaderCategoryId,
  type ToolCategory,
  type ToolDefinition,
} from "@/config/tools";
import type { NavDropdown } from "@/lib/nav-config";

export type MegaMenuNavItem = {
  slug: string;
  href: string;
  label: string;
};

export type MegaMenuNavColumn = {
  id: string;
  label: string;
  items: MegaMenuNavItem[];
};

export type MegaMenuNavGroup = {
  id: string;
  label: string;
  columns: MegaMenuNavColumn[];
};

export type FooterToolsColumn = {
  id: string;
  label: string;
  items: { slug: string; href: string; label: string }[];
};

type Translator = (key: string) => string;

const definitionsBySlug = new Map<string, ToolDefinition>(
  TOOL_DEFINITIONS.map((tool) => [tool.slug, tool]),
);

function resolveToolItem(t: Translator, slug: string): MegaMenuNavItem | null {
  const tool = definitionsBySlug.get(slug);
  if (!tool) return null;
  return {
    slug: tool.slug,
    href: toolPath(tool.slug),
    label: t(`navItems.${tool.labelKey}`),
  };
}

function toolsForCategories(categories: readonly ToolCategory[]): ToolDefinition[] {
  const seen = new Set<string>();
  const result: ToolDefinition[] = [];

  for (const tool of TOOL_DEFINITIONS) {
    if (!tool.categories.some((category) => categories.includes(category))) continue;
    if (seen.has(tool.slug)) continue;
    seen.add(tool.slug);
    result.push(tool);
  }

  return result;
}

export type AllToolsNavItem = MegaMenuNavItem;
export type AllToolsNavColumn = MegaMenuNavColumn;
export type AllToolsNavGroup = MegaMenuNavGroup;

/** Build category modal content from the central registry. */
export function buildCategoryNav(t: Translator, category: HeaderCategoryId): AllToolsNavGroup[] {
  const groups = buildAllToolsNav(t);
  if (category === "all") return groups;
  return groups.filter((group) => group.id === category);
}

export function getCategoryTitleKey(category: HeaderCategoryId): string {
  const button = HEADER_CATEGORY_BUTTONS.find((entry) => entry.id === category);
  return button?.labelKey ?? "allTools.title";
}

/** Build all-tools modal groups from the central registry. */
export function buildAllToolsNav(t: Translator): AllToolsNavGroup[] {
  return ALL_TOOLS_REGISTRY.map((group) => ({
    id: group.id,
    label: t(group.labelKey),
    columns: group.columns
      .map((column) => ({
        id: column.id,
        label: t(column.labelKey),
        items: column.slugs
          .map((slug) => resolveToolItem(t, slug))
          .filter((item): item is MegaMenuNavItem => item !== null),
      }))
      .filter((column) => column.items.length > 0),
  })).filter((group) => group.columns.length > 0);
}

/** @deprecated Use buildAllToolsNav */
export function buildMegaMenuNav(t: Translator): MegaMenuNavGroup[] {
  return buildAllToolsNav(t);
}

/** @deprecated Use buildMegaMenuNav — kept for legacy callers. */
export function buildHeaderNavDropdowns(t: Translator): NavDropdown[] {
  return buildMegaMenuNav(t).map((group) => ({
    id: group.id,
    label: group.label,
    sections: group.columns.map((column) => ({
      id: column.id,
      label: column.label,
      items: column.items.map((item) => ({ href: item.href, label: item.label })),
    })),
  }));
}

/** Build footer tools panel columns from registry groups. */
export function buildFooterToolsColumns(t: Translator): FooterToolsColumn[] {
  return FOOTER_PANEL_GROUPS.map((group) => ({
    id: group.id,
    label: t(group.labelKey),
    items: toolsForCategories(group.categories).map((tool) => ({
      slug: tool.slug,
      href: toolPath(tool.slug),
      label: t(`navItems.${tool.labelKey}`),
    })),
  })).filter((column) => column.items.length > 0);
}

/** Lookup a registered tool by slug (for validation / future use). */
export function getRegisteredTool(slug: string): ToolDefinition | undefined {
  return definitionsBySlug.get(slug);
}

export {
  TOOL_DEFINITIONS,
  TOOL_REGISTRY,
  ALL_TOOLS_REGISTRY,
  MEGA_MENU_CONFIG,
  HEADER_CATEGORY_BUTTONS,
  HEADER_CATEGORY_IDS,
  getToolRegistryCategory,
  isRegistryTool,
  toolPath,
} from "@/config/tools";
export type { HeaderCategoryId, SearchIndexEntry, SearchAssetType, ToolRegistryCategory } from "@/config/tools";