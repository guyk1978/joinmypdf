import {
  buildInventoryGridItems,
  buildInventoryGridItemsForIds,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const NETWORK_TOOLS_HUB_PATH = "/tools/network-tools/";
export const MY_IP_TOOL_PATH = "/tools/network-tools/my-ip/";
export const MY_IP_TOOL_SLUG = "my-ip";
export const NETWORK_TOOL_IDS = getInventoryIdsByCategory("network") as readonly string[];

/** Featured order on the Network & API Tools hub. */
export const NETWORK_HUB_FEATURED_IDS = [
  "my-ip",
  "user-agent-parser",
  "jwt-debugger",
  "url-encoder-decoder",
  "url-parameter-stripper",
  "ssl-decoder",
] as const;

export function buildNetworkToolGridItems(
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  const featured = buildInventoryGridItemsForIds(
    [...NETWORK_HUB_FEATURED_IDS],
    t,
    "network",
    locale,
  );
  const rest = buildInventoryGridItems("network", t, locale).filter(
    (item) =>
      !NETWORK_HUB_FEATURED_IDS.includes(
        item.slugHint as (typeof NETWORK_HUB_FEATURED_IDS)[number],
      ),
  );
  const seen = new Set(featured.map((item) => item.slugHint));
  return [...featured, ...rest.filter((item) => !seen.has(item.slugHint))];
}

export function getNetworkToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("network", t);
}
