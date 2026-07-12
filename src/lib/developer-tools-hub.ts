import {
  buildInventoryGridItems,
  buildInventoryGridItemsForIds,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  getInventoryToolsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const DEVELOPER_TOOLS_HUB_PATH = "/tools/developer-tools/";

export type DeveloperHubGroupId = "security" | "generation" | "utilities" | "more";

const GENERATION_IDS = new Set([
  "uuid-generator",
  "string-generator",
  "password-generator",
  "qr-code-generator",
  "lorem-ipsum-generator",
]);

const SECURITY_IDS = new Set([
  "password-generator",
  "hash-generator",
  "ssl-decoder",
  "jwt-debugger",
  "base64-encoder-decoder",
]);

function partitionDeveloperIds(): Record<DeveloperHubGroupId, string[]> {
  const all = getInventoryIdsByCategory("developer");
  const security: string[] = [];
  const generation: string[] = [];
  const utilities: string[] = [];
  const more: string[] = [];
  const seen = new Set<string>();

  for (const id of all) {
    if (SECURITY_IDS.has(id) && id !== "password-generator") {
      security.push(id);
      seen.add(id);
    } else if (GENERATION_IDS.has(id)) {
      generation.push(id);
      seen.add(id);
    }
  }

  // password-generator belongs in both security + generation intents — keep under generation.
  for (const id of all) {
    if (seen.has(id)) continue;
    if (id.includes("json") || id.includes("url") || id.includes("user-agent") || id.includes("sql")) {
      utilities.push(id);
      seen.add(id);
    } else {
      more.push(id);
      seen.add(id);
    }
  }

  return { security, generation, utilities, more };
}

const PARTITIONS = partitionDeveloperIds();

export const DEVELOPER_HUB_TOOL_GROUPS: {
  id: DeveloperHubGroupId;
  toolIds: readonly string[];
}[] = (
  [
    { id: "security" as const, toolIds: PARTITIONS.security },
    { id: "generation" as const, toolIds: PARTITIONS.generation },
    { id: "utilities" as const, toolIds: PARTITIONS.utilities },
    { id: "more" as const, toolIds: PARTITIONS.more },
  ] as const
).filter((group) => group.toolIds.length > 0);

export const DEVELOPER_HUB_TOOL_IDS = getInventoryIdsByCategory("developer");

export type DeveloperHubToolId = string;

type DeveloperToolsTranslator = InventoryTranslator;

export function buildDeveloperHubToolGridItem(
  id: string,
  t?: DeveloperToolsTranslator,
): ToolGridItem {
  return buildInventoryGridItemsForIds([id], t)[0]!;
}

export function buildDeveloperHubGroupItems(
  groupId: DeveloperHubGroupId,
  t?: DeveloperToolsTranslator,
): ToolGridItem[] {
  const group = DEVELOPER_HUB_TOOL_GROUPS.find((entry) => entry.id === groupId);
  if (!group) return [];
  return buildInventoryGridItemsForIds(group.toolIds, t);
}

export function buildDeveloperHubAllItems(t?: DeveloperToolsTranslator): ToolGridItem[] {
  return buildInventoryGridItems("developer", t);
}

export function getDeveloperHubFeatureLabels(t?: DeveloperToolsTranslator): string[] {
  return [
    "Security Utilities",
    "Developer Tools",
    ...getInventoryFeatureLabels("developer", t),
  ];
}

/** Inventory count helper for schema / audits. */
export function getDeveloperInventoryCount(): number {
  return getInventoryToolsByCategory("developer").length;
}
