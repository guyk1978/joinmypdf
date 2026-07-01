import { resolveHomeToolCopy } from "@/lib/home-tool-copy";

export type HomeSecurityToolId = "password-generator" | "hash-generator" | "uuid-generator";

export type HomeSecurityToolIconKey = "key-round" | "hash" | "fingerprint";

export type HomeSecurityToolItem = {
  id: HomeSecurityToolId;
  href: string;
  label: string;
  description: string;
  iconKey: HomeSecurityToolIconKey;
};

const SECURITY_TOOL_META: Record<
  HomeSecurityToolId,
  { iconKey: HomeSecurityToolIconKey; messageKey: string }
> = {
  "password-generator": { iconKey: "key-round", messageKey: "passwordGenerator" },
  "hash-generator": { iconKey: "hash", messageKey: "hashGenerator" },
  "uuid-generator": { iconKey: "fingerprint", messageKey: "uuidGenerator" },
};

const SECURITY_ITEMS_NS = "securityTools";

export const HOME_SECURITY_TOOL_IDS = Object.keys(SECURITY_TOOL_META) as HomeSecurityToolId[];

export const HOMEPAGE_FEATURED_SECURITY_IDS = HOME_SECURITY_TOOL_IDS;

export type HomeFeaturedSecurityItem = {
  id: HomeSecurityToolId;
  href: string;
  label: string;
  iconKey: HomeSecurityToolIconKey;
};

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export function buildHomepageFeaturedSecurityItems(tHome: HomeTranslator): HomeFeaturedSecurityItem[] {
  return HOMEPAGE_FEATURED_SECURITY_IDS.map((id) => {
    const meta = SECURITY_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: resolveHomeToolCopy(tHome, SECURITY_ITEMS_NS, meta.messageKey, "label", id),
      iconKey: meta.iconKey,
    };
  });
}

export function buildHomeSecurityToolItems(tHome: HomeTranslator): HomeSecurityToolItem[] {
  return HOME_SECURITY_TOOL_IDS.map((id) => {
    const meta = SECURITY_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: resolveHomeToolCopy(tHome, SECURITY_ITEMS_NS, meta.messageKey, "label", id),
      description: resolveHomeToolCopy(tHome, SECURITY_ITEMS_NS, meta.messageKey, "description", id),
      iconKey: meta.iconKey,
    };
  });
}
