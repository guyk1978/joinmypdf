/**
 * Central JoinMyPDF tools index for modal DOC/RELATED and dashboard lookups.
 *
 * Each entry carries a `related` array of tool IDs. The ToolModal RELATED tab
 * resolves those IDs through this map — no per-tool UI wiring required.
 *
 * Sources: tools inventory (paths/titles) + tools.json `relatedTools`, with
 * same-category peers as fallback when `relatedTools` is empty.
 */

import { TOOLS_INVENTORY, getToolsInventoryEntry } from "@/data/tools-inventory";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { registry } from "@/lib/registry";
import { getRelatedInventoryToolIds } from "@/lib/tools-inventory-query";

export type ToolsDataEntry = {
  id: string;
  title: string;
  href: string;
  description: string;
  category: InventoryCategoryId | string;
  /** Tool IDs shown in the modal [RELATED] tab. */
  related: string[];
};

function resolveRelatedIds(id: string, explicit: string[] | undefined): string[] {
  const fromRegistry = (explicit ?? []).filter((peer) => peer && peer !== id);
  if (fromRegistry.length > 0) return fromRegistry;

  return getRelatedInventoryToolIds(id, { limit: 8 });
}

function buildToolsData(): Record<string, ToolsDataEntry> {
  const map: Record<string, ToolsDataEntry> = {};

  for (const entry of TOOLS_INVENTORY) {
    const registryTool = registry.tools.find((tool) => tool.slug === entry.id);
    map[entry.id] = {
      id: entry.id,
      title: registryTool?.title ?? entry.title,
      href: entry.path,
      description: registryTool?.description ?? entry.description ?? "",
      category: entry.primaryCategory,
      related: resolveRelatedIds(entry.id, registryTool?.relatedTools),
    };
  }

  // Include registry-only tools that are not yet in inventory.
  for (const tool of registry.tools) {
    if (map[tool.slug]) continue;
    const inventory = getToolsInventoryEntry(tool.slug);
    map[tool.slug] = {
      id: tool.slug,
      title: tool.title,
      href: inventory?.path ?? `/tools/${tool.slug}/`,
      description: tool.description ?? inventory?.description ?? "",
      category: inventory?.primaryCategory ?? tool.category,
      related: resolveRelatedIds(tool.slug, tool.relatedTools),
    };
  }

  return map;
}

/** All tools keyed by ID — single source for RELATED lookups. */
export const TOOLS_DATA: Record<string, ToolsDataEntry> = buildToolsData();

export function listToolsData(): ToolsDataEntry[] {
  return Object.values(TOOLS_DATA);
}

export function getToolsDataEntry(id: string): ToolsDataEntry | undefined {
  return TOOLS_DATA[id];
}

/**
 * Resolve RELATED tab links from `TOOLS_DATA[id].related`.
 * Unknown IDs are skipped; results are capped by `limit`.
 */
export function getRelatedToolsFromData(
  id: string,
  limit = 8,
): ToolsDataEntry[] {
  const entry = TOOLS_DATA[id];
  if (!entry) return [];

  const seen = new Set<string>([id]);
  const results: ToolsDataEntry[] = [];

  for (const peerId of entry.related) {
    if (seen.has(peerId) || results.length >= limit) continue;
    const peer = TOOLS_DATA[peerId];
    if (!peer) continue;
    seen.add(peerId);
    results.push(peer);
  }

  return results;
}

/** Category tool counts for hub cards. */
export function getToolsDataCountByCategory(category: string): number {
  return listToolsData().filter(
    (tool) =>
      tool.category === category ||
      getToolsInventoryEntry(tool.id)?.categories.includes(
        category as InventoryCategoryId,
      ),
  ).length;
}

/** Normalize a path for comparison: no locale, trailing slash, no query/hash. */
export function normalizeToolPath(path: string): string {
  const bare = path.split("?")[0]?.split("#")[0] ?? path;
  let pathname = bare.startsWith("/") ? bare : `/${bare}`;
  // Strip locale prefix if present (/en/tools/... → /tools/...)
  pathname = pathname.replace(/^\/(en|he)(?=\/)/, "");
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  if (pathname.length > 1 && !pathname.endsWith("/")) pathname = `${pathname}/`;
  return pathname;
}

const TOOLS_DATA_BY_PATH: Map<string, ToolsDataEntry> = (() => {
  const map = new Map<string, ToolsDataEntry>();
  for (const entry of listToolsData()) {
    map.set(normalizeToolPath(entry.href), entry);
    map.set(normalizeToolPath(`/tools/${entry.id}/`), entry);
  }
  return map;
})();

/**
 * Match a pathname (with or without locale) to a tool entry.
 * Returns null for hubs (/tools/pdf-tools/) and unknown routes.
 */
export function findToolsDataByPathname(pathname: string): ToolsDataEntry | null {
  const normalized = normalizeToolPath(pathname);
  return TOOLS_DATA_BY_PATH.get(normalized) ?? null;
}

/** Canonical app path for a tool (locale-free, for next-intl router). */
export function getToolModalPath(entry: Pick<ToolsDataEntry, "href" | "id">): string {
  return normalizeToolPath(entry.href || `/tools/${entry.id}/`);
}

