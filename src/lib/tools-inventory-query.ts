import {
  INVENTORY_HUB_META,
  type InventoryCategoryId,
  type ToolsInventoryEntry,
} from "@/data/inventory-hubs";
import {
  TOOLS_INVENTORY,
  getToolsInventoryEntry,
  type ToolsInventoryId,
} from "@/data/tools-inventory";
import { TOOL_DEFINITIONS } from "@/config/tools";
import { getAudioToolById } from "@/lib/audio-tools";
import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export type InventoryTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

const LABEL_KEY_BY_SLUG = Object.fromEntries(
  TOOL_DEFINITIONS.map((tool) => [tool.slug, tool.labelKey]),
) as Record<string, string>;

export function getInventoryToolsByCategory(
  category: InventoryCategoryId,
): ToolsInventoryEntry[] {
  return TOOLS_INVENTORY.filter((tool) =>
    (tool.categories as readonly InventoryCategoryId[]).includes(category),
  );
}

export function getInventoryToolsByPrimaryCategory(
  category: InventoryCategoryId,
): ToolsInventoryEntry[] {
  return TOOLS_INVENTORY.filter((tool) => tool.primaryCategory === category);
}

export function getInventoryIdsByCategory(category: InventoryCategoryId): string[] {
  return getInventoryToolsByCategory(category).map((tool) => tool.id);
}

function resolveInventoryLabel(
  entry: ToolsInventoryEntry,
  t?: InventoryTranslator,
  hubNamespaceTools = true,
): string {
  const labelKey = entry.labelKey ?? LABEL_KEY_BY_SLUG[entry.id];
  if (labelKey && t) {
    const hubKey = hubNamespaceTools ? `tools.${labelKey}` : labelKey;
    if (t.has(hubKey)) return t(hubKey);
    // Header.navItems style keys when translator is Header-scoped
    if (t.has(`navItems.${labelKey}`)) return t(`navItems.${labelKey}`);
  }

  return (
    entry.title ||
    registry.tools.find((tool) => tool.slug === entry.id)?.title ||
    getAudioToolById(entry.id)?.name ||
    entry.id
  );
}

export function buildInventoryGridItems(
  category: InventoryCategoryId,
  t?: InventoryTranslator,
): ToolGridItem[] {
  return getInventoryToolsByCategory(category).map((entry) => ({
    href: entry.path,
    label: resolveInventoryLabel(entry, t),
    slugHint: entry.id,
  }));
}

export function buildInventoryGridItemsForIds(
  ids: readonly string[],
  t?: InventoryTranslator,
): ToolGridItem[] {
  return ids
    .map((id) => getToolsInventoryEntry(id) ?? {
      id,
      title: id,
      path: `/tools/${id}/`,
      description: "",
      categories: [] as const,
      primaryCategory: "convert" as const,
    })
    .map((entry) => ({
      href: entry.path,
      label: resolveInventoryLabel(entry as ToolsInventoryEntry, t),
      slugHint: entry.id,
    }));
}

export function getInventoryFeatureLabels(category: InventoryCategoryId, t?: InventoryTranslator): string[] {
  return buildInventoryGridItems(category, t).map((item) => item.label);
}

/**
 * Related tools: prefer shared category peers (excluding self), capped.
 * Callers may merge with tools.json relatedTools.
 */
export function getRelatedInventoryToolIds(
  slug: string,
  options?: { limit?: number; preferCategory?: InventoryCategoryId },
): string[] {
  const entry = getToolsInventoryEntry(slug);
  if (!entry) return [];

  const limit = options?.limit ?? 8;
  const preferred = options?.preferCategory ?? entry.primaryCategory;
  const pool = getInventoryToolsByCategory(preferred).filter((tool) => tool.id !== slug);

  // Prefer peers that share the most categories with the current tool.
  const scored = pool
    .map((tool) => {
      const shared = tool.categories.filter((c) =>
        (entry.categories as readonly InventoryCategoryId[]).includes(c),
      ).length;
      return { id: tool.id, shared };
    })
    .sort((a, b) => b.shared - a.shared || a.id.localeCompare(b.id));

  return scored.slice(0, limit).map((item) => item.id);
}

export function getInventoryHubPath(category: InventoryCategoryId): string {
  return INVENTORY_HUB_META[category].path;
}

export type InventoryHubLink = {
  id: InventoryCategoryId;
  href: string;
  title: string;
};

function normalizeHubPath(path: string): string {
  if (!path || path === "/") return path;
  return path.endsWith("/") ? path : `${path}/`;
}

/**
 * Dedicated category hub links from inventory SSOT.
 * Skips catch-all `/tools/` placeholders and dedupes shared hub paths
 * (e.g. audio + mp3 → one link). New hubs in INVENTORY_HUB_META appear automatically.
 */
export function listDedicatedInventoryHubLinks(): InventoryHubLink[] {
  const primaryUsed = new Set(
    TOOLS_INVENTORY.map((tool) => tool.primaryCategory as InventoryCategoryId),
  );
  const seenPaths = new Set<string>();
  const links: InventoryHubLink[] = [];

  for (const [rawId, meta] of Object.entries(INVENTORY_HUB_META) as Array<
    [InventoryCategoryId, (typeof INVENTORY_HUB_META)[InventoryCategoryId]]
  >) {
    const href = normalizeHubPath(meta.path);
    if (!href || href === "/tools/" || href === "/tools") continue;

    const pathKey = href.replace(/\/$/, "") || href;
    if (seenPaths.has(pathKey)) continue;

    const hasTools =
      primaryUsed.has(rawId) || getInventoryToolsByCategory(rawId).length > 0;
    if (!hasTools) continue;

    seenPaths.add(pathKey);
    links.push({ id: rawId, href, title: meta.title });
  }

  return links;
}

/** Every inventory id that is missing from a slug list (orphan detection). */
export function findInventoryOrphans(listedSlugs: Iterable<string>): ToolsInventoryId[] {
  const listed = new Set(listedSlugs);
  return TOOLS_INVENTORY_IDS_TYPED().filter((id) => !listed.has(id));
}

function TOOLS_INVENTORY_IDS_TYPED(): ToolsInventoryId[] {
  return TOOLS_INVENTORY.map((tool) => tool.id as ToolsInventoryId);
}

export function resolveInventoryToolLabel(id: string, t?: InventoryTranslator): string {
  const entry = getToolsInventoryEntry(id);
  if (!entry) {
    return (
      registry.tools.find((tool) => tool.slug === id)?.title ??
      getAudioToolById(id)?.name ??
      id
    );
  }
  return resolveInventoryLabel(entry, t);
}
