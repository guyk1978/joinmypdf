import { resolveHomeToolCopy } from "@/lib/home-tool-copy";

const DEVELOPER_ITEMS_NS = "developerTools";

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

/** Homepage — 3 flagship developer tools */
export const HOMEPAGE_FEATURED_DEVELOPER_IDS = [
  "user-agent-parser",
  "jwt-debugger",
  "qr-code-generator",
] as const;

export type HomeFeaturedDeveloperItem = {
  id: HomeDeveloperToolId;
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
  return HOMEPAGE_FEATURED_DEVELOPER_IDS.map((id) => {
    const { iconKey, messageKey } = DEVELOPER_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: resolveDeveloperToolCopy(tHome, id, messageKey, "label"),
      iconKey,
    };
  });
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
