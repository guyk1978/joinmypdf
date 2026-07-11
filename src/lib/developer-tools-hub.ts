import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const DEVELOPER_TOOLS_HUB_PATH = "/tools/developer-tools/";

export type DeveloperHubGroupId = "security" | "generation" | "utilities";

export type DeveloperHubToolId =
  | "password-generator"
  | "hash-generator"
  | "base64-encoder-decoder"
  | "uuid-generator"
  | "string-generator"
  | "json-formatter"
  | "url-encoder-decoder";

export const DEVELOPER_HUB_TOOL_GROUPS: {
  id: DeveloperHubGroupId;
  toolIds: readonly DeveloperHubToolId[];
}[] = [
  {
    id: "security",
    toolIds: ["password-generator", "hash-generator", "base64-encoder-decoder"],
  },
  {
    id: "generation",
    toolIds: ["uuid-generator", "string-generator"],
  },
  {
    id: "utilities",
    toolIds: ["json-formatter", "url-encoder-decoder"],
  },
];

export const DEVELOPER_HUB_TOOL_IDS = DEVELOPER_HUB_TOOL_GROUPS.flatMap((group) => [...group.toolIds]);

const DEVELOPER_HUB_MESSAGE_KEYS: Record<DeveloperHubToolId, string> = {
  "password-generator": "passwordGenerator",
  "hash-generator": "hashGenerator",
  "base64-encoder-decoder": "base64EncoderDecoder",
  "uuid-generator": "uuidGenerator",
  "string-generator": "stringGenerator",
  "json-formatter": "jsonFormatter",
  "url-encoder-decoder": "urlEncoderDecoder",
};

/** Hub-facing labels for clearer intents. */
const DEVELOPER_HUB_LABEL_OVERRIDES: Partial<Record<DeveloperHubToolId, string>> = {
  "hash-generator": "hashGeneratorSha",
  "uuid-generator": "uuidGuidGenerator",
  "json-formatter": "jsonValidator",
};

type DeveloperToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return registry.tools.find((tool) => tool.slug === slug)?.title;
}

function resolveDeveloperHubToolLabel(id: DeveloperHubToolId, t?: DeveloperToolsTranslator): string {
  const overrideKey = DEVELOPER_HUB_LABEL_OVERRIDES[id];
  if (overrideKey) {
    const hubKey = `tools.${overrideKey}`;
    if (t?.has(hubKey)) return t(hubKey);
  }

  const messageKey = DEVELOPER_HUB_MESSAGE_KEYS[id];
  const labelKey = `tools.${messageKey}`;
  const fallback = getToolTitle(id) ?? id;
  return t?.has(labelKey) ? t(labelKey) : fallback;
}

export function buildDeveloperHubToolGridItem(
  id: DeveloperHubToolId,
  t?: DeveloperToolsTranslator,
): ToolGridItem {
  return {
    href: `/tools/${id}/`,
    label: resolveDeveloperHubToolLabel(id, t),
    slugHint: id,
  };
}

export function buildDeveloperHubGroupItems(
  groupId: DeveloperHubGroupId,
  t?: DeveloperToolsTranslator,
): ToolGridItem[] {
  const group = DEVELOPER_HUB_TOOL_GROUPS.find((entry) => entry.id === groupId);
  if (!group) return [];
  return group.toolIds.map((id) => buildDeveloperHubToolGridItem(id, t));
}

export function getDeveloperHubFeatureLabels(t?: DeveloperToolsTranslator): string[] {
  const labels = DEVELOPER_HUB_TOOL_IDS.map((id) => resolveDeveloperHubToolLabel(id, t));
  return ["Security Utilities", "Developer Tools", ...labels];
}
