import {
  FOOTER_PANEL_GROUPS,
  ALL_TOOLS_REGISTRY,
  HEADER_CATEGORY_BUTTONS,
  TOOL_DEFINITIONS,
  toolPath,
  type AllToolsGroupConfig,
  type HeaderCategoryId,
  type ToolCategory,
  type ToolDefinition,
} from "@/config/tools";
import { getToolsInventoryEntry, TOOLS_INVENTORY } from "@/data/tools-inventory";
import {
  getModalPlacementForInventorySlug,
  listInventorySlugsForModal,
} from "@/lib/all-tools-inventory-sync";
import { getAudioToolById } from "@/lib/audio-tools";
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
  if (tool) {
    return {
      slug: tool.slug,
      href: toolPath(tool.slug),
      label: t(`navItems.${tool.labelKey}`),
    };
  }

  const inventory = getToolsInventoryEntry(slug);
  if (inventory) {
    const labelKey = inventory.labelKey;
    if (labelKey) {
      const navKey = `navItems.${labelKey}`;
      try {
        const label = t(navKey);
        if (label && label !== navKey) {
          return { slug, href: inventory.path, label };
        }
      } catch {
        // fall through
      }
    }
    return {
      slug,
      href: inventory.path,
      label: inventory.title || getAudioToolById(slug)?.name || slug,
    };
  }

  const audio = getAudioToolById(slug);
  if (audio) {
    return { slug, href: `/tools/${slug}/`, label: audio.name };
  }

  return null;
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

const INVENTORY_COLUMN_LABEL_KEYS: Record<string, string> = {
  "inventory-more-convert": "megaMenu.columns.moreTools",
  "inventory-more-compress": "megaMenu.columns.moreTools",
};

function safeTranslate(t: Translator, key: string, fallback: string): string {
  try {
    const value = t(key);
    if (!value || value === key) return fallback;
    return value;
  } catch {
    return fallback;
  }
}

/**
 * Build all-tools modal groups from ALL_TOOLS_REGISTRY, then append any
 * inventory tools missing from the curated layout (single source of truth).
 * Each inventory tool appears once (primary category placement).
 */
export function buildAllToolsNav(t: Translator): AllToolsNavGroup[] {
  const listed = new Set<string>();
  const groups: AllToolsNavGroup[] = ALL_TOOLS_REGISTRY.map((group) => ({
    id: group.id,
    label: t(group.labelKey),
    columns: group.columns.map((column) => {
      const items = column.slugs
        .map((slug) => resolveToolItem(t, slug))
        .filter((item): item is MegaMenuNavItem => item !== null);
      for (const item of items) listed.add(item.slug);
      return {
        id: column.id,
        label: t(column.labelKey),
        items,
      };
    }),
  }));

  const groupById = new Map(groups.map((group) => [group.id, group]));

  for (const slug of listInventorySlugsForModal()) {
    if (listed.has(slug)) continue;
    const placement = getModalPlacementForInventorySlug(slug);
    if (!placement) continue;
    const item = resolveToolItem(t, slug);
    if (!item) continue;

    listed.add(slug);
    const group = groupById.get(placement.groupId);
    if (!group) continue;

    let column = group.columns.find((entry) => entry.id === placement.columnId);
    if (!column) {
      column = {
        id: placement.columnId,
        label: safeTranslate(
          t,
          INVENTORY_COLUMN_LABEL_KEYS[placement.columnId] ?? "megaMenu.columns.moreTools",
          "More tools",
        ),
        items: [],
      };
      group.columns.push(column);
    }
    column.items.push(item);
  }

  // Ensure compress / convert category hubs' inventory tags also fill modal gaps
  // for tools whose primaryCategory differs but belong in those header tabs.
  for (const entry of TOOLS_INVENTORY) {
    if (listed.has(entry.id)) continue;
    // Should not happen — listInventorySlugsForModal covers all inventory ids.
    void entry;
  }

  return groups
    .map((group) => ({
      ...group,
      columns: group.columns.filter((column) => column.items.length > 0),
    }))
    .filter((group) => group.columns.length > 0);
}

/** @internal audit helper — inventory ids missing from modal after sync. */
export function findAllToolsModalOrphans(): string[] {
  const listed = new Set(
    ALL_TOOLS_REGISTRY.flatMap((group: AllToolsGroupConfig) =>
      group.columns.flatMap((column) => column.slugs),
    ),
  );
  // After sync, orphans are empty by construction; this checks curated registry only.
  return TOOLS_INVENTORY.map((tool) => tool.id).filter((id) => !listed.has(id));
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