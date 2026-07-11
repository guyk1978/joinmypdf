import { resolveHomeToolCopy } from "@/lib/home-tool-copy";
import { DEVELOPER_TOOLS_HUB_PATH } from "@/lib/developer-tools-hub";
import { JSON_TOOLS_HUB_PATH } from "@/lib/json-tools";
import { YAML_TOOLS_HUB_PATH } from "@/lib/yaml-tools";
import { XML_TOOLS_HUB_PATH } from "@/lib/xml-tools";

const DEVELOPER_ITEMS_NS = "developerTools";

export type HomeDeveloperToolId = "user-agent-parser" | "qr-code-generator" | "jwt-debugger";

export type HomeDeveloperHubId =
  | "developer-tools-hub"
  | "json-tools-hub"
  | "yaml-tools-hub"
  | "xml-tools-hub";

export type HomeDeveloperToolIconKey =
  | "globe"
  | "qr-code"
  | "key-round"
  | "braces"
  | "file-code"
  | "code-xml";

export type HomeDeveloperToolItem = {
  id: HomeDeveloperToolId;
  href: string;
  label: string;
  description: string;
  iconKey: HomeDeveloperToolIconKey;
};

const DEVELOPER_TOOL_META: Record<
  HomeDeveloperToolId,
  { iconKey: HomeDeveloperToolIconKey; messageKey: string }
> = {
  "user-agent-parser": { iconKey: "globe", messageKey: "userAgentParser" },
  "qr-code-generator": { iconKey: "qr-code", messageKey: "qrCodeGenerator" },
  "jwt-debugger": { iconKey: "key-round", messageKey: "jwtDebugger" },
};

const DEVELOPER_HUB_META: Record<
  HomeDeveloperHubId,
  { href: string; iconKey: HomeDeveloperToolIconKey; labelKey: string; fallbackLabel: string }
> = {
  "developer-tools-hub": {
    href: DEVELOPER_TOOLS_HUB_PATH,
    iconKey: "key-round",
    labelKey: "developerToolsHubLabel",
    fallbackLabel: "Developer Tools",
  },
  "json-tools-hub": {
    href: JSON_TOOLS_HUB_PATH,
    iconKey: "braces",
    labelKey: "jsonToolsHubLabel",
    fallbackLabel: "JSON Tools",
  },
  "yaml-tools-hub": {
    href: YAML_TOOLS_HUB_PATH,
    iconKey: "file-code",
    labelKey: "yamlToolsHubLabel",
    fallbackLabel: "YAML Tools",
  },
  "xml-tools-hub": {
    href: XML_TOOLS_HUB_PATH,
    iconKey: "code-xml",
    labelKey: "xmlToolsHubLabel",
    fallbackLabel: "XML Tools",
  },
};

export const HOME_DEVELOPER_TOOL_IDS = Object.keys(DEVELOPER_TOOL_META) as HomeDeveloperToolId[];

/** Homepage — developer hub first, then format hubs, then flagship tools */
export const HOMEPAGE_FEATURED_DEVELOPER_HUB_IDS = [
  "developer-tools-hub",
  "json-tools-hub",
  "yaml-tools-hub",
  "xml-tools-hub",
] as const satisfies readonly HomeDeveloperHubId[];

export const HOMEPAGE_FEATURED_DEVELOPER_IDS = [
  "user-agent-parser",
  "jwt-debugger",
  "qr-code-generator",
] as const;

export type HomeFeaturedDeveloperItem = {
  id: HomeDeveloperToolId | HomeDeveloperHubId;
  href: string;
  label: string;
  iconKey: HomeDeveloperToolIconKey;
};

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function resolveDeveloperToolCopy(
  tHome: HomeTranslator,
  id: HomeDeveloperToolId,
  messageKey: string,
  field: "label" | "description",
): string {
  return resolveHomeToolCopy(tHome, DEVELOPER_ITEMS_NS, messageKey, field, id);
}

export function buildHomepageFeaturedDeveloperItems(tHome: HomeTranslator): HomeFeaturedDeveloperItem[] {
  const hubItems = HOMEPAGE_FEATURED_DEVELOPER_HUB_IDS.map((id) => {
    const meta = DEVELOPER_HUB_META[id];
    return {
      id,
      href: meta.href,
      label: tHome.has(meta.labelKey) ? tHome(meta.labelKey) : meta.fallbackLabel,
      iconKey: meta.iconKey,
    };
  });

  const toolItems = HOMEPAGE_FEATURED_DEVELOPER_IDS.map((id) => {
    const { iconKey, messageKey } = DEVELOPER_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: resolveDeveloperToolCopy(tHome, id, messageKey, "label"),
      iconKey,
    };
  });

  return [...hubItems, ...toolItems];
}

export function buildHomeDeveloperToolItems(tHome: HomeTranslator): HomeDeveloperToolItem[] {
  return HOME_DEVELOPER_TOOL_IDS.map((id) => {
    const { iconKey, messageKey } = DEVELOPER_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: resolveDeveloperToolCopy(tHome, id, messageKey, "label"),
      description: resolveDeveloperToolCopy(tHome, id, messageKey, "description"),
      iconKey,
    };
  });
}
