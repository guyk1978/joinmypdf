import { TOOLS_INVENTORY, type InventoryCategoryId } from "@/data/tools-inventory";

/**
 * Homepage hero — navigational tool tile catalog (all inventory utilities).
 */

export type HomeHeroTileTool = {
  slug: string;
  primaryCategory: InventoryCategoryId;
};

/**
 * Every unique directory tool, for the fixed-height hero tile grid.
 */
export function listHomeHeroTileTools(): HomeHeroTileTool[] {
  const seen = new Set<string>();
  const tools: HomeHeroTileTool[] = [];

  for (const entry of TOOLS_INVENTORY) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    tools.push({
      slug: entry.id,
      primaryCategory: entry.primaryCategory,
    });
  }

  return tools;
}

/** @deprecated Use listHomeHeroTileTools */
export function listHomeHeroLaunchTools(): HomeHeroTileTool[] {
  return listHomeHeroTileTools();
}

/** @deprecated Prefer listHomeHeroTileTools() */
export const HOME_HERO_LAUNCH_TOOLS: readonly HomeHeroTileTool[] =
  listHomeHeroTileTools();

export function getHomeHeroLaunchTool(slug: string): HomeHeroTileTool | undefined {
  const entry = TOOLS_INVENTORY.find((item) => item.id === slug);
  if (!entry) return undefined;
  return { slug: entry.id, primaryCategory: entry.primaryCategory };
}

/** @deprecated Alias for HomeHeroTileTool */
export type HomeHeroLaunchTool = HomeHeroTileTool;
