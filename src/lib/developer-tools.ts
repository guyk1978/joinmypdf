import { registry } from "@/lib/registry";

export type HomeDeveloperToolId = "user-agent-parser" | "qr-code-generator" | "jwt-debugger";

export type HomeDeveloperToolIconKey = "globe" | "qr-code" | "key-round";

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

export const HOME_DEVELOPER_TOOL_IDS = Object.keys(DEVELOPER_TOOL_META) as HomeDeveloperToolId[];

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function isMissingHomeTranslation(value: string, messageKey: string, field: "label" | "description"): boolean {
  if (!value) return true;
  const leaf = `developerTools.items.${messageKey}.${field}`;
  if (value === leaf) return true;
  return value.includes("developerTools.items.") && value.endsWith(`.${field}`);
}

function resolveDeveloperToolCopy(
  tHome: HomeTranslator,
  id: HomeDeveloperToolId,
  messageKey: string,
  field: "label" | "description",
): string {
  const key = `developerTools.items.${messageKey}.${field}`;
  if (tHome.has(key)) {
    const value = tHome(key);
    if (!isMissingHomeTranslation(value, messageKey, field)) return value;
  }

  const tool = registry.tools.find((entry) => entry.slug === id);
  if (!tool) return id;
  return field === "label" ? tool.title : tool.description;
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
